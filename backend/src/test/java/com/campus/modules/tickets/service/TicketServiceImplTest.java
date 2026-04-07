package com.campus.modules.tickets.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.campus.common.enums.TicketCategory;
import com.campus.common.enums.TicketPriority;
import com.campus.common.enums.TicketStatus;
import com.campus.common.enums.UserRole;
import com.campus.common.exception.BadRequestException;
import com.campus.common.exception.ConflictException;
import com.campus.common.exception.ResourceNotFoundException;
import com.campus.domain.Resource;
import com.campus.domain.Ticket;
import com.campus.domain.User;
import com.campus.modules.tickets.dto.AssignTicketRequest;
import com.campus.modules.tickets.dto.CreateTicketRequest;
import com.campus.modules.tickets.dto.TicketResponse;
import com.campus.modules.tickets.dto.UpdateTicketStatusRequest;
import com.campus.modules.tickets.notify.NotificationPublisher;
import com.campus.modules.tickets.storage.FileStorageService;
import com.campus.repository.CommentRepository;
import com.campus.repository.ResourceRepository;
import com.campus.repository.TicketRepository;
import com.campus.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

// Pure Mockito unit tests for the ticket workflow.
//
// Why Mockito and not @SpringBootTest? Because:
//   - These tests run in milliseconds (no Spring context, no database).
//   - They isolate the business logic so a failing test always means the
//     workflow code itself is wrong, not Mongo or Spring.
//   - Easy to run on CI without an internet connection.
//
// What we cover:
//   - createTicket validation (resource OR location, max 3 attachments)
//   - assignTicket happy path + role checks
//   - The state machine inside updateStatus (the riskiest part)
//   - deleteTicket with the OPEN-only rule for owners
@ExtendWith(MockitoExtension.class)
class TicketServiceImplTest {

    @Mock private TicketRepository ticketRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private NotificationPublisher notificationPublisher;

    @InjectMocks private TicketServiceImpl ticketService;

    // ---- helpers ----------------------------------------------------------

    private static final String OWNER_ID = "user-owner";
    private static final String TECH_ID = "user-tech";
    private static final String ADMIN_ID = "user-admin";

    private CreateTicketRequest validCreateRequest() {
        return new CreateTicketRequest(
            null,
            "Block A, Lab 3",
            "Projector dead",
            "Lamp burned out during the morning lecture",
            TicketCategory.IT_EQUIPMENT,
            TicketPriority.HIGH,
            "owner@campus.lk"
        );
    }

    private Ticket sampleTicket(TicketStatus status) {
        return Ticket.builder()
            .id("ticket-1")
            .title("Projector dead")
            .description("desc")
            .category(TicketCategory.IT_EQUIPMENT)
            .priority(TicketPriority.HIGH)
            .contactDetails("owner@campus.lk")
            .location("Block A, Lab 3")
            .createdBy(OWNER_ID)
            .assignedTo(status == TicketStatus.OPEN ? null : TECH_ID)
            .status(status)
            .attachments(new ArrayList<>())
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    private User technicianUser() {
        User u = new User();
        u.setId(TECH_ID);
        u.setRole(UserRole.TECHNICIAN);
        return u;
    }

    private User normalUser() {
        User u = new User();
        u.setId("rando");
        u.setRole(UserRole.USER);
        return u;
    }

    // ----------------------------------------------------------------------
    // createTicket
    // ----------------------------------------------------------------------

    @Nested
    @DisplayName("createTicket")
    class CreateTicket {

        @Test
        @DisplayName("saves a new ticket with status OPEN")
        void createTicket_happyPath_returnsResponse() {
            CreateTicketRequest request = validCreateRequest();
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(invocation -> {
                    Ticket t = invocation.getArgument(0);
                    t.setId("ticket-1");
                    return t;
                });

            TicketResponse response = ticketService.createTicket(OWNER_ID, request, List.of());

            assertThat(response.id()).isEqualTo("ticket-1");
            assertThat(response.status()).isEqualTo(TicketStatus.OPEN);
            assertThat(response.createdBy()).isEqualTo(OWNER_ID);
            assertThat(response.title()).isEqualTo("Projector dead");
            verify(ticketRepository, times(1)).save(any(Ticket.class));
        }

        @Test
        @DisplayName("rejects when neither resource nor location is given")
        void createTicket_noResourceNoLocation_throws() {
            CreateTicketRequest request = new CreateTicketRequest(
                null, null, "title", "desc",
                TicketCategory.OTHER, TicketPriority.LOW, "me@x.com"
            );

            assertThatThrownBy(() -> ticketService.createTicket(OWNER_ID, request, List.of()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("resource or a location");
            verify(ticketRepository, never()).save(any());
        }

        @Test
        @DisplayName("rejects when resourceId points to a non-existent resource")
        void createTicket_unknownResource_throwsNotFound() {
            CreateTicketRequest request = new CreateTicketRequest(
                "unknown-id", null, "title", "desc",
                TicketCategory.OTHER, TicketPriority.LOW, "me@x.com"
            );
            when(resourceRepository.findById("unknown-id")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> ticketService.createTicket(OWNER_ID, request, List.of()))
                .isInstanceOf(ResourceNotFoundException.class);
            verify(ticketRepository, never()).save(any());
        }

        @Test
        @DisplayName("rejects more than 3 attachments")
        void createTicket_tooManyAttachments_throws() {
            CreateTicketRequest request = validCreateRequest();
            List<MultipartFile> tooMany = List.of(
                mockFile(), mockFile(), mockFile(), mockFile()
            );

            assertThatThrownBy(() -> ticketService.createTicket(OWNER_ID, request, tooMany))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("at most 3");
            verify(ticketRepository, never()).save(any());
        }

        @Test
        @DisplayName("accepts a valid resource id by looking it up")
        void createTicket_withValidResource_savesTicket() {
            CreateTicketRequest request = new CreateTicketRequest(
                "res-1", null, "title", "desc",
                TicketCategory.NETWORK, TicketPriority.MEDIUM, "me@x.com"
            );
            when(resourceRepository.findById("res-1"))
                .thenReturn(Optional.of(new Resource()));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            TicketResponse response = ticketService.createTicket(OWNER_ID, request, List.of());

            assertThat(response.resourceId()).isEqualTo("res-1");
            assertThat(response.location()).isNull();
        }

        // We do not actually upload files in unit tests - the service only sees a
        // mocked MultipartFile object. The file size and type checks live inside
        // FileStorageService which has its own tests (or could).
        private MultipartFile mockFile() {
            return org.mockito.Mockito.mock(MultipartFile.class);
        }
    }

    // ----------------------------------------------------------------------
    // assignTicket
    // ----------------------------------------------------------------------

    @Nested
    @DisplayName("assignTicket")
    class AssignTicket {

        @Test
        @DisplayName("OPEN ticket + valid technician -> status becomes ASSIGNED")
        void assignTicket_happyPath_movesStatus() {
            Ticket open = sampleTicket(TicketStatus.OPEN);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(open));
            when(userRepository.findById(TECH_ID)).thenReturn(Optional.of(technicianUser()));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            TicketResponse response = ticketService.assignTicket(
                "ticket-1", new AssignTicketRequest(TECH_ID)
            );

            assertThat(response.status()).isEqualTo(TicketStatus.ASSIGNED);
            assertThat(response.assignedTo()).isEqualTo(TECH_ID);
            verify(notificationPublisher, times(1))
                .notify(any(), any(), any(), any());
        }

        @Test
        @DisplayName("rejects assigning a ticket that is not OPEN")
        void assignTicket_notOpen_throwsConflict() {
            Ticket inProgress = sampleTicket(TicketStatus.IN_PROGRESS);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(inProgress));

            assertThatThrownBy(() ->
                ticketService.assignTicket("ticket-1", new AssignTicketRequest(TECH_ID))
            ).isInstanceOf(ConflictException.class);
        }

        @Test
        @DisplayName("rejects assigning a non-technician user")
        void assignTicket_normalUser_throwsBadRequest() {
            Ticket open = sampleTicket(TicketStatus.OPEN);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(open));
            when(userRepository.findById("rando")).thenReturn(Optional.of(normalUser()));

            assertThatThrownBy(() ->
                ticketService.assignTicket("ticket-1", new AssignTicketRequest("rando"))
            ).isInstanceOf(BadRequestException.class)
             .hasMessageContaining("not a technician");
        }
    }

    // ----------------------------------------------------------------------
    // updateStatus - the state machine
    // ----------------------------------------------------------------------

    @Nested
    @DisplayName("updateStatus state machine")
    class UpdateStatus {

        @Test
        @DisplayName("ASSIGNED -> IN_PROGRESS works for the assignee")
        void assignedToInProgress_byAssignee_succeeds() {
            Ticket assigned = sampleTicket(TicketStatus.ASSIGNED);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(assigned));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            TicketResponse response = ticketService.updateStatus(
                "ticket-1", TECH_ID, UserRole.TECHNICIAN,
                new UpdateTicketStatusRequest(TicketStatus.IN_PROGRESS, null, null)
            );

            assertThat(response.status()).isEqualTo(TicketStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("ASSIGNED -> IN_PROGRESS fails for a random user")
        void assignedToInProgress_byRandomUser_throws() {
            Ticket assigned = sampleTicket(TicketStatus.ASSIGNED);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(assigned));

            assertThatThrownBy(() -> ticketService.updateStatus(
                "ticket-1", "rando", UserRole.TECHNICIAN,
                new UpdateTicketStatusRequest(TicketStatus.IN_PROGRESS, null, null)
            )).isInstanceOf(BadRequestException.class);
        }

        @Test
        @DisplayName("IN_PROGRESS -> RESOLVED requires resolution notes")
        void inProgressToResolved_withoutNotes_throws() {
            Ticket inProgress = sampleTicket(TicketStatus.IN_PROGRESS);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(inProgress));

            assertThatThrownBy(() -> ticketService.updateStatus(
                "ticket-1", TECH_ID, UserRole.TECHNICIAN,
                new UpdateTicketStatusRequest(TicketStatus.RESOLVED, null, null)
            )).isInstanceOf(BadRequestException.class)
             .hasMessageContaining("resolution notes");
        }

        @Test
        @DisplayName("IN_PROGRESS -> RESOLVED works with notes by the assignee")
        void inProgressToResolved_withNotes_succeeds() {
            Ticket inProgress = sampleTicket(TicketStatus.IN_PROGRESS);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(inProgress));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            TicketResponse response = ticketService.updateStatus(
                "ticket-1", TECH_ID, UserRole.TECHNICIAN,
                new UpdateTicketStatusRequest(TicketStatus.RESOLVED, "Replaced lamp", null)
            );

            assertThat(response.status()).isEqualTo(TicketStatus.RESOLVED);
            assertThat(response.resolutionNotes()).isEqualTo("Replaced lamp");
        }

        @Test
        @DisplayName("REJECTED requires a reason")
        void rejected_withoutReason_throws() {
            Ticket open = sampleTicket(TicketStatus.OPEN);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(open));

            assertThatThrownBy(() -> ticketService.updateStatus(
                "ticket-1", ADMIN_ID, UserRole.ADMIN,
                new UpdateTicketStatusRequest(TicketStatus.REJECTED, null, null)
            )).isInstanceOf(BadRequestException.class)
             .hasMessageContaining("reason");
        }

        @Test
        @DisplayName("REJECTED requires admin role")
        void rejected_byNonAdmin_throws() {
            Ticket open = sampleTicket(TicketStatus.OPEN);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(open));

            assertThatThrownBy(() -> ticketService.updateStatus(
                "ticket-1", OWNER_ID, UserRole.USER,
                new UpdateTicketStatusRequest(TicketStatus.REJECTED, null, "no good")
            )).isInstanceOf(BadRequestException.class);
        }

        @Test
        @DisplayName("RESOLVED -> CLOSED works for the owner")
        void resolvedToClosed_byOwner_succeeds() {
            Ticket resolved = sampleTicket(TicketStatus.RESOLVED);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(resolved));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            TicketResponse response = ticketService.updateStatus(
                "ticket-1", OWNER_ID, UserRole.USER,
                new UpdateTicketStatusRequest(TicketStatus.CLOSED, null, null)
            );

            assertThat(response.status()).isEqualTo(TicketStatus.CLOSED);
        }

        @Test
        @DisplayName("RESOLVED -> IN_PROGRESS (re-open) works for the owner")
        void resolvedToInProgress_reopen_byOwner_succeeds() {
            Ticket resolved = sampleTicket(TicketStatus.RESOLVED);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(resolved));
            when(ticketRepository.save(any(Ticket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

            TicketResponse response = ticketService.updateStatus(
                "ticket-1", OWNER_ID, UserRole.USER,
                new UpdateTicketStatusRequest(TicketStatus.IN_PROGRESS, null, null)
            );

            assertThat(response.status()).isEqualTo(TicketStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("CLOSED is terminal - any further move is rejected")
        void closed_isTerminal() {
            Ticket closed = sampleTicket(TicketStatus.CLOSED);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(closed));

            assertThatThrownBy(() -> ticketService.updateStatus(
                "ticket-1", ADMIN_ID, UserRole.ADMIN,
                new UpdateTicketStatusRequest(TicketStatus.IN_PROGRESS, null, null)
            )).isInstanceOf(ConflictException.class);
        }

        @Test
        @DisplayName("REJECTED is terminal - any further move is rejected")
        void rejected_isTerminal() {
            Ticket rejected = sampleTicket(TicketStatus.REJECTED);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(rejected));

            assertThatThrownBy(() -> ticketService.updateStatus(
                "ticket-1", ADMIN_ID, UserRole.ADMIN,
                new UpdateTicketStatusRequest(TicketStatus.IN_PROGRESS, null, null)
            )).isInstanceOf(ConflictException.class);
        }
    }

    // ----------------------------------------------------------------------
    // deleteTicket
    // ----------------------------------------------------------------------

    @Nested
    @DisplayName("deleteTicket")
    class DeleteTicket {

        @Test
        @DisplayName("owner can delete their own OPEN ticket and cascades comments")
        void delete_ownerOpen_cascadesComments() {
            Ticket open = sampleTicket(TicketStatus.OPEN);
            open.setAttachments(List.of("file1.png"));
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(open));

            ticketService.deleteTicket("ticket-1", OWNER_ID, UserRole.USER);

            verify(fileStorageService, times(1)).delete("file1.png");
            verify(commentRepository, times(1)).deleteByTicketId("ticket-1");
            verify(ticketRepository, times(1)).delete(open);
        }

        @Test
        @DisplayName("owner cannot delete a ticket past OPEN")
        void delete_ownerNonOpen_throws() {
            Ticket inProgress = sampleTicket(TicketStatus.IN_PROGRESS);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(inProgress));

            assertThatThrownBy(() ->
                ticketService.deleteTicket("ticket-1", OWNER_ID, UserRole.USER)
            ).isInstanceOf(BadRequestException.class)
             .hasMessageContaining("still open");
            verify(ticketRepository, never()).delete(any());
        }

        @Test
        @DisplayName("admin can delete a ticket at any status")
        void delete_adminAnyStatus_succeeds() {
            Ticket inProgress = sampleTicket(TicketStatus.IN_PROGRESS);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(inProgress));

            ticketService.deleteTicket("ticket-1", ADMIN_ID, UserRole.ADMIN);

            verify(ticketRepository, times(1)).delete(inProgress);
        }

        @Test
        @DisplayName("a stranger cannot delete somebody else's ticket")
        void delete_stranger_throws() {
            Ticket open = sampleTicket(TicketStatus.OPEN);
            when(ticketRepository.findById("ticket-1")).thenReturn(Optional.of(open));

            assertThatThrownBy(() ->
                ticketService.deleteTicket("ticket-1", "rando", UserRole.USER)
            ).isInstanceOf(BadRequestException.class);
            verify(ticketRepository, never()).delete(any());
        }
    }
}
