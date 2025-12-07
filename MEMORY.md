
# CrewConnect Project Memory

## Project Context
CrewConnect is a PWA built for Lightspeed Construction Group to manage field operations. It serves as a central hub for assigning work (assignments), tracking progress, reporting issues, and communication.

## Key Design Decisions

### 1. Data Architecture (Client-Side First)
- **Storage**: The app currently uses `localStorage` to persist data (`services/store.ts`). This allows for a fully functional prototype without a backend.
- **Mock Data**: Initial state is seeded from `services/mockData.ts`.
- **Excel Sync**: A critical feature is the ability to sync with a hosted Excel file (`tillman-project.xlsx`). The app parses this file to:
  - Create Assignments based on "NTP Number".
  - Create Users (Crews) based on "Vendor" columns if they don't exist.
  - Extract Metadata like "Market", "Footage", "Address".

### 2. User Roles
- **Crew**: Simplified view. Can only see their assignments. Focus on large buttons for status updates (En Route, Started, Completed).
- **Supervisor**: Operational view. Can manage multiple crews, create assignments, resolve issues.
- **Manager/Executive**: Strategic view. High-level charts, full visibility, user management.

### 3. Feature Evolution
- **Phase 1 (MVP)**: Basic auth, dashboards, manual assignment creation.
- **Phase 2 (Enhancements)**: 
  - **Excel Sync**: Added robust parsing and auto-sync (30 min interval).
  - **Maps**: Integrated Leaflet for visual location tracking.
  - **Photos**: Added Base64 photo storage for status updates.
  - **AI**: Integrated Gemini Flash 2.5 for a "Field Assistant" with Maps/Search grounding.
  - **User Mgmt**: Added full Create/Edit/Delete capabilities for admins.

## Critical Code Paths

### Excel Sync Logic (`services/store.ts`)
The `syncProjectsFromExcel` function is complex. It handles:
- Fetching the file (bypassing cache with timestamps).
- Fuzzy matching column headers (e.g., "NTP" vs "NTP Number").
- Creating new users with temporary passwords ("Welcome1") if the Vendor doesn't exist.
- Deduplicating assignments based on NTP Number.

### Status Updates
Updates flow through `updateAssignmentStatus`. This updates the current status *and* pushes a new entry to the `history` array, preserving a timeline of who did what and when, along with photos/notes.

## Future Considerations
- **Backend Migration**: The `dataService` pattern in `store.ts` is designed to be easily swapped for API calls.
- **Offline Support**: PWA manifest and Service Workers are partially set up but need full caching strategies for the "Offline Mode" requirement.
