# Module C - Test & Demo Evidence

This folder holds screenshots and proof artefacts for the IT3030 PAF
assignment report. They are referenced from the main report under
Section 9 (Testing & Quality) and Section 8 (Workflows).

Member 3 - Maintenance & Incident Ticketing.

## What goes in here

### Test evidence
| File | Shows |
|---|---|
| `test-results.png` | The terminal output of `mvn test -Dtest=TicketServiceImplTest` showing **22 tests run, 0 failures, 0 errors, BUILD SUCCESS** |
| `postman-collection.png` | The Postman collection imported, showing all requests in the side panel |
| `postman-create-ticket.png` | A successful POST /api/tickets response (201 Created) |
| `postman-assign.png` | A successful PATCH /api/tickets/{id}/assign response |

### UI workflow screenshots (the 8-step lifecycle)
| File | Shows |
|---|---|
| `ui-01-create-form.png` | The CreateTicketPage form filled in, with image previews |
| `ui-02-my-tickets.png` | MyTicketsPage with the new ticket showing as "Open" |
| `ui-03-admin-list.png` | TicketListPage (admin view) showing all tickets |
| `ui-04-quick-assign.png` | The Quick Assign panel expanded with a technician id |
| `ui-05-tech-queue-active.png` | AssignedTicketsPage active queue with "Start Work" button |
| `ui-06-resolve-form.png` | The Resolve form open with notes typed |
| `ui-07-resolved-details.png` | TicketDetailsPage showing status RESOLVED with notes box |
| `ui-08-closed.png` | Final closed state visible to the reporter |

### Negative-path screenshots (validation)
| File | Shows |
|---|---|
| `error-too-many-attachments.png` | The 400 response or UI message when uploading 4+ images |
| `error-resolve-no-notes.png` | The 400 response when trying to resolve without notes |
| `error-not-allowed.png` | The 400/403 when a non-owner tries to view a ticket |

## How to add a new screenshot

1. Take the screenshot (Win+Shift+S in Windows, save with the snipping tool)
2. Save the PNG into this folder using one of the names above
3. (Optional) Update the table to add your new file

This whole folder is committed to git so the lecturer can browse it
without running the project.
