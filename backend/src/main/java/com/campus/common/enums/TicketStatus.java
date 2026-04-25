package com.campus.common.enums;

// All the states a ticket can be in.
//
// Normal flow:
//   OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
//
// A user can also push RESOLVED back to IN_PROGRESS if the issue is not
// really fixed (re-open).
//
// An admin can also REJECT a ticket at any open stage with a reason
// (for example duplicate, or not really an issue).
public enum TicketStatus {
    OPEN,         // just created by the user, nobody assigned yet
    ASSIGNED,     // admin picked a technician, work has not started
    IN_PROGRESS,  // technician is actively working on it
    RESOLVED,     // technician finished, waiting for the user to confirm
    CLOSED,       // user (or admin) confirmed the fix - terminal state
    REJECTED      // admin rejected the ticket with a reason - terminal state
}
