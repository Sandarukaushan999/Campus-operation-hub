package com.campus.common.enums;

// How urgent a ticket is.
// The user picks one of these when they create a ticket.
// Admins can use it to sort the queue and decide what to fix first.
public enum TicketPriority {
    LOW,      // not urgent, can wait a few days (e.g. broken chair)
    MEDIUM,   // should be fixed soon (e.g. flickering light)
    HIGH,     // important, fix today if possible (e.g. WiFi down in a lab)
    URGENT    // safety / blocking issue, fix immediately (e.g. exposed wiring)
}
