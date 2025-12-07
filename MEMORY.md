
# CrewConnect Project Memory

## Project Context
CrewConnect is a PWA built for Lightspeed Construction Group to manage field operations. It serves as a central hub for assigning work (assignments), tracking progress, reporting issues, and communication.

## Key Design Decisions

### 1. Data Architecture (Client-Side First)
- **Storage**: The app currently uses `localStorage` to persist data (`services/store.ts`). This allows for a fully functional prototype without a backend.
- **Mock Data**: Initial state is seeded from `services/mockData.ts`.
- **Excel Sync (Multi-Source)**: A critical feature is the ability to sync with hosted Excel files. 
  - **Main Project File**: `tillman-project.xlsx` driven by "NTP Number" or "Map #".
  - **Secondary File**: `locate-tickets.xlsx` which is fetched, parsed, and merged into the main project data based on the Project Number.
  - **Auto-Creation**: Users (Crews and Supervisors) are automatically created if their names appear in the Excel file but not in the local DB.

### 2. User Roles
- **Crew**: Simplified view. Can only see their assignments. Focus on large buttons for status updates (En Route, Started, Completed).
- **Supervisor**: Operational view. Can manage multiple crews, create assignments, resolve issues.
- **Manager/Executive**: Strategic view. High-level charts, full visibility, user management.

### 3. Feature Evolution
- **Phase 1 (MVP)**: Basic auth, dashboards, manual assignment creation.
- **Phase 2 (Enhancements)**: 
  - **Advanced Sync**: Multi-file ingestion, Header Detection (scans for "NTP", "Map #"), and robust column mapping.
  - **Smart Status Mapping**: Strict rules to map Excel statuses (e.g., "In Process" -> Started, "Locates Called" -> Pending).
  - **Maps**: Integrated Leaflet for visual location tracking and "Nav" button using raw address text.
  - **Photos**: Added Base64 photo storage for status updates.
  - **AI**: Integrated Gemini Flash 2.5 for a "Field Assistant" with context injection of the full project database.
  - **User Mgmt**: Added full Create/Edit/Delete capabilities for users and issues.

## Critical Code Paths

### Excel Sync Logic (`services/store.ts`)
The `syncProjectsFromExcel` function is the core data engine. It:
1.  **Fetches Locate Tickets**: Parses `locate-tickets.xlsx` first, mapping "Map #" to ticket strings (1st, 2nd, 3rd tickets).
2.  **Fetches Main Projects**: Parses `tillman-project.xlsx`.
3.  **Header Detection**: Dynamically scans the first 20 rows to find the actual header row (looking for "NTP" or "Map #"), making it resilient to extra top rows.
4.  **Merging**: Combines the locate tickets into the project details.
5.  **Status Logic**: Applies `mapStatus` to enforce business rules (e.g., "Construction Status" column dictates the app state).

### Status Updates
Updates flow through `updateAssignmentStatus`. This updates the current status *and* pushes a new entry to the `history` array, preserving a timeline of who did what and when, along with photos/notes.
- **Edit Mode Override**: Supervisors can manually override status via the "Edit" screen, where they can see the original "Excel Status" for reference.

## Future Considerations
- **Backend Migration**: The `dataService` pattern in `store.ts` is designed to be easily swapped for API calls.
- **Offline Support**: PWA manifest and Service Workers are partially set up but need full caching strategies for the "Offline Mode" requirement.
