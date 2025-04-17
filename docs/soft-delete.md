# Soft Delete Implementation

This document describes the soft delete functionality implemented for event management in La Huella del Caminante.

## Overview

Soft deletion allows events to be "deleted" without actually removing them from the database. This approach:

- Preserves data integrity and history
- Allows for event recovery if needed
- Provides better auditability of admin actions
- Reduces risk of accidental permanent data loss

## Database Schema Changes

The following changes were made to the `Event` model in Prisma:

```prisma
model Event {
  // Existing fields...

  isDeleted   Boolean     @default(false) // Soft delete flag
  deletedAt   DateTime?   // When the event was deleted
}
```

## Service Layer Functions

The event service (`src/services/events.ts`) was updated with the following functions:

### 1. Modified Query Functions

All query functions were updated to filter out deleted events by default, with an option to include them:

```typescript
function getAllEvents({ includeDeleted = false } = {}): Promise<Event[]>;
function getEventById(id: string, { includeDeleted = false } = {}): Promise<Event | null>;
// Other query functions...
```

### 2. Soft Delete Functions

New functions were added to handle soft deletion and restoration:

```typescript
// Mark an event as deleted
function deleteEvent(id: string): Promise<Event | null>;

// Restore a deleted event
function restoreEvent(id: string): Promise<Event | null>;

// Get all deleted events
function getDeletedEvents(): Promise<Event[]>;

// Permanently delete an event (admin only)
function permanentlyDeleteEvent(id: string): Promise<void>;
```

## API Routes

The following API routes were implemented for soft delete management:

| Route                                 | Method | Description                 | Access Level  |
| ------------------------------------- | ------ | --------------------------- | ------------- |
| `/api/events/[id]/delete`             | DELETE | Mark an event as deleted    | Auth Required |
| `/api/events/[id]/restore`            | POST   | Restore a deleted event     | Auth Required |
| `/api/events/[id]/permanently-delete` | DELETE | Permanently delete an event | Admin Only    |
| `/api/events/deleted`                 | GET    | List all deleted events     | Admin Only    |

## Frontend Updates

Events marked as deleted are:

- Hidden from public event listings
- Hidden from artist profile event listings
- Hidden from event searches and filters
- Only visible to administrators in the admin dashboard

## Security Considerations

- Soft delete operations require user authentication
- Restoration of deleted events requires user authentication
- Permanent deletion and viewing deleted events requires admin privileges

## Future Enhancements

- Adding a "trash" view for administrators to see recently deleted events
- Implementing automatic permanent deletion after a certain time period
- Adding bulk restore/delete operations for administrators
