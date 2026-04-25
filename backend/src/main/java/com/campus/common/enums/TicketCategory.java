package com.campus.common.enums;

// What kind of issue a ticket is about.
// Used so admins can filter tickets and route them to the right technician.
//
// Note: this is an enum for now (Stage A). Later (Stage B) we plan to move
// these into a "ticket_categories" collection so admins can add new ones
// from a UI without changing code.
public enum TicketCategory {
    ELECTRICAL,    // power outlets, lights, switches, breakers
    NETWORK,       // WiFi, LAN ports, internet outage
    FURNITURE,     // chairs, tables, desks, cupboards
    IT_EQUIPMENT,  // projectors, computers, cameras, printers
    PLUMBING,      // taps, leaks, toilets, drains
    OTHER          // anything that doesn't fit the categories above
}
