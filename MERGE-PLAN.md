# Merge Plan for Cloudinary Integration

This document outlines the logical grouping of commits in the `feature/cloudinary-integration` branch to facilitate a structured code review process before merging to `main`.

## Logical Groupings

### 1. Core Cloudinary Integration

**Key Features:**
- Add `public_id` field to Image model in Prisma schema
- Create CloudinaryUpload component
- Basic image upload functionality

**Commits:**
- 0eba51b: feat: add public_id to images for Cloudinary integration
- 63ab95a: fix: solucionar problema de subida de imágenes en creación de eventos
- c167ecc: fix: fix linter errors in cloudinary-upload component
- 8954796: fix: improve CloudinaryUpload component with local image management
- ecfe67b: fix: replace deprecated onUpload with onSuccess in CloudinaryUpload component

### 2. Event Form Implementation with Cloudinary

**Key Features:**
- Implement event creation form with image upload
- Clean up code and improve translations

**Commits:**
- 89a15bb: feat: implement event form with cloudinary image upload
- 4a5d2c3: refactor: clean up code and translate comments to English in event form
- 75ffeec: refactor: remove debug info from CloudinaryUpload and adjust image container styles

### 3. Event Creation Page Refactoring

**Key Features:**
- Reorganize event creation page into server and client components
- Create ArtistSelector component
- Handle temporary artist creation

**Commits:**
- 994ee25: refactor: reorganize event creation page with server and client components
- 015b1f2: feat: create ArtistSelector component for event creation
- 64ffd47: fix: handle temporary artist creation in server actions
- 4451fd7: fix: update client component to use createEventHandler instead of createEvent

### 4. UI Component Updates

**Key Features:**
- Update EventForm to support multiple artists
- Improve Alert component styles
- Update service interfaces and type definitions
- Update event UI components

**Commits:**
- 6ab0eab: refactor: update EventForm to support multiple artists
- ff46f44: refactor: update Alert component styles
- 1f37ddb: refactor: update service interfaces and type definitions
- 2713703: refactor: update event UI components

### 5. Error Handling and Dashboard Updates

**Key Features:**
- Add exception handling
- Update dashboard page

**Commits:**
- 517c381: feat: add exceptions handling and update dashboard page

### 6. Slug Generation Refactoring

**Key Features:**
- Unify slug generation using a central utility function

**Commits:**
- cf8b7ff: refactor: unify slug generation using slugify from central utils.ts
- 5b409ef: test: update artist test

## Merge Recommendation

Given the interdependencies between these changes, we recommend:

1. Conducting a thorough code review by logical grouping as outlined above
2. Merge the entire branch at once rather than attempting to split it into smaller PRs
3. After merging, consider extracting the Cloudinary upload component into a reusable library for future use

## Testing Plan

The following areas should be tested thoroughly before merging:

1. Image upload functionality in event creation form
2. Artist selector in event form
3. Error handling scenarios
4. Slug generation for new entities
5. Dashboard navigation and UI components 