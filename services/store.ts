
import { User, Assignment, Issue, Message, AssignmentStatus, UserRole, AssignmentHistoryEntry } from '../types';
import { MOCK_USERS, MOCK_ASSIGNMENTS, MOCK_ISSUES, MOCK_MESSAGES } from './mockData';

// Declare XLSX for TypeScript since it's loaded via CDN
declare const XLSX: any;

const KEYS = {
  USER: 'cc_user',
  USERS_DB: 'cc_users_db',
  ASSIGNMENTS: 'cc_assignments',
  ISSUES: 'cc_issues',
  MESSAGES: 'cc_messages',
  LAST_SYNC: 'cc_last_sync'
};

const LOCATE_TICKETS_URL = 'https://jckraus1.github.io/Tillman-Dashboard/locate-tickets.xlsx';

// Initialize Store
const initStore = () => {
  try {
    if (!localStorage.getItem(KEYS.ASSIGNMENTS)) localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(MOCK_ASSIGNMENTS));
    if (!localStorage.getItem(KEYS.ISSUES)) localStorage.setItem(KEYS.ISSUES, JSON.stringify(MOCK_ISSUES));
    if (!localStorage.getItem(KEYS.MESSAGES)) localStorage.setItem(KEYS.MESSAGES, JSON.stringify(MOCK_MESSAGES));
    if (!localStorage.getItem(KEYS.USERS_DB)) {
      const usersWithPass = MOCK_USERS.map(u => ({ ...u, password: 'password', isTempPassword: false }));
      localStorage.setItem(KEYS.USERS_DB, JSON.stringify(usersWithPass));
    }
  } catch (e) {
    console.error("Store init error", e);
  }
};

initStore();

// Helper: Find a value in a row object using multiple possible key names (case-insensitive fuzzy match)
const getRowValue = (row: any, possibleKeys: string[]) => {
  if (!row) return null;
  const rowKeys = Object.keys(row);
  
  // Normalization helper: remove special chars, lowercase
  const normalize = (str: string) => str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const key of possibleKeys) {
    const searchKey = normalize(key);
    // Find a key in the row that matches our search key (exact or includes)
    const foundKey = rowKeys.find(rk => normalize(rk) === searchKey || normalize(rk).includes(searchKey));
    
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== "") {
      return row[foundKey];
    }
  }
  return null;
};

// Helper: Convert Excel Serial Date to String
const excelDateToString = (serial: any) => {
  if (!serial) return undefined;
  if (typeof serial === 'string') return serial;
  // Excel base date logic
  if (typeof serial === 'number') {
    if (serial > 20000) { // arbitrary check to ensure it looks like a date serial
       const utc_days  = Math.floor(serial - 25569);
       const utc_value = utc_days * 86400;                                        
       const date_info = new Date(utc_value * 1000);
       // Adjusting for timezone to get simple MM/DD/YYYY
       const d = new Date(Math.round((serial - 25569)*86400*1000));
       // Use UTC methods to avoid timezone shifts from 1899 epoch
       const month = d.getUTCMonth() + 1;
       const day = d.getUTCDate();
       const year = d.getUTCFullYear();
       return `${month}/${day}/${year}`;
    }
  }
  return String(serial);
};

// Helper: Format Percentage (remove decimals)
const formatPercentage = (val: any) => {
  if (val === undefined || val === null || val === '') return undefined;
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  // If decimal <= 1, treat as ratio (0.5 = 50), else treat as integer (50 = 50)
  const pct = num <= 1.0 ? num * 100 : num;
  return Math.round(pct).toString();
};

// Helper: Map Construction Status to App Status
export const mapStatus = (statusRaw: any): AssignmentStatus => {
  const s = String(statusRaw || '').toLowerCase().trim();
  
  if (!s || s === '0' || s === 'null') return 'pending';

  // 1. Blocked / Issues
  if (s.includes('issue') || s.includes('hold') || s.includes('blocked') || s.includes('stopped')) return 'blocked';

  // 2. Completion / Payment
  // Must check "Complete" carefully to ensure it's not "Locates Complete" if that implies pending
  // But usually "Locates Complete" is a specific phrase. 
  // If status is JUST "Complete", it's completed.
  if (s === 'complete' || s === 'completed' || s.includes('paid') || s.includes('invoiced') || s.includes('done')) return 'completed';
  
  // 3. Pending / Locates
  // "Locates Called" -> Pending
  if (s.includes('locates') || s.includes('pending') || s.includes('not started') || s.includes('assigned')) return 'pending';

  // 4. Active Work (In Process -> Started)
  if (
    s.includes('process') || 
    s.includes('started') || 
    s.includes('construction') || 
    s.includes('working') || 
    s.includes('active') ||
    s.includes('drilling') ||
    s.includes('placing')
  ) return 'started';
  
  // 5. Default fallback
  return 'pending';
};

export const dataService = {
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },

  getAllUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
  },

  createUser: (userData: Omit<User, 'id'>): User => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
    const newUser: User = {
      ...userData,
      id: `u${Date.now()}${Math.floor(Math.random() * 1000)}`
    };
    users.push(newUser);
    localStorage.setItem(KEYS.USERS_DB, JSON.stringify(users));
    return newUser;
  },

  updateUser: (id: string, updates: Partial<User>) => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...updates } : u);
    localStorage.setItem(KEYS.USERS_DB, JSON.stringify(updatedUsers));
  },

  deleteUser: (id: string) => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
    const filteredUsers = users.filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS_DB, JSON.stringify(filteredUsers));
  },

  login: (email: string, passwordAttempt: string): { success: boolean; user?: User; error?: string } => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) return { success: false, error: 'User not found' };
    if (user.password !== passwordAttempt) return { success: false, error: 'Invalid password' };

    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    return { success: true, user };
  },

  changePassword: (userId: string, newPassword: string) => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
    const updatedUsers = users.map(u => u.id === userId ? { ...u, password: newPassword, isTempPassword: false } : u);
    localStorage.setItem(KEYS.USERS_DB, JSON.stringify(updatedUsers));
    
    const currentUser = dataService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem(KEYS.USER, JSON.stringify({ ...currentUser, password: newPassword, isTempPassword: false }));
    }
  },

  logout: () => localStorage.removeItem(KEYS.USER),

  getUsersByRole: (role: UserRole): User[] => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
    return users.filter(u => u.role === role);
  },

  getAssignments: (): Assignment[] => JSON.parse(localStorage.getItem(KEYS.ASSIGNMENTS) || '[]'),

  getAssignment: (id: string): Assignment | undefined => {
    const assignments = JSON.parse(localStorage.getItem(KEYS.ASSIGNMENTS) || '[]');
    return assignments.find((a: Assignment) => a.id === id);
  },

  createAssignment: (assignmentData: Omit<Assignment, 'id' | 'status' | 'notes' | 'history'>) => {
    const assignments = JSON.parse(localStorage.getItem(KEYS.ASSIGNMENTS) || '[]');
    const newAssignment: Assignment = {
      ...assignmentData,
      id: `a${Date.now()}`,
      status: 'pending',
      metrics: { targetFootage: assignmentData.metrics.targetFootage, completedFootage: 0 },
      notes: [],
      history: [{ status: 'pending', timestamp: new Date().toISOString(), updatedBy: assignmentData.supervisorId, notes: 'Assignment created' }]
    };
    assignments.push(newAssignment);
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    return newAssignment;
  },

  updateAssignment: (id: string, updates: Partial<Assignment>) => {
    const assignments: Assignment[] = JSON.parse(localStorage.getItem(KEYS.ASSIGNMENTS) || '[]');
    const updated = assignments.map(a => a.id === id ? { ...a, ...updates } : a);
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(updated));
  },

  deleteAssignment: (id: string) => {
    const assignments: Assignment[] = JSON.parse(localStorage.getItem(KEYS.ASSIGNMENTS) || '[]');
    const filteredAssignments = assignments.filter(a => a.id !== id);
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(filteredAssignments));
  },

  updateAssignmentStatus: (id: string, status: AssignmentStatus, userId: string, notes?: string, footage?: number, photos?: string[]) => {
    const assignments: Assignment[] = JSON.parse(localStorage.getItem(KEYS.ASSIGNMENTS) || '[]');
    const updated = assignments.map(a => {
      if (a.id === id) {
        const historyEntry: AssignmentHistoryEntry = {
          status,
          timestamp: new Date().toISOString(),
          updatedBy: userId,
          notes,
          footage,
          photos
        };
        return {
          ...a,
          status,
          metrics: footage !== undefined ? { ...a.metrics, completedFootage: footage } : a.metrics,
          history: [historyEntry, ...(a.history || [])]
        };
      }
      return a;
    });
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(updated));
    return updated;
  },

  getIssues: (): Issue[] => JSON.parse(localStorage.getItem(KEYS.ISSUES) || '[]'),

  createIssue: (issue: Omit<Issue, 'id' | 'timestamp'>) => {
    const issues = JSON.parse(localStorage.getItem(KEYS.ISSUES) || '[]');
    const newIssue: Issue = { ...issue, id: `i${Date.now()}`, timestamp: new Date().toISOString() };
    issues.push(newIssue);
    localStorage.setItem(KEYS.ISSUES, JSON.stringify(issues));
  },

  updateIssue: (id: string, updates: Partial<Issue>) => {
    const issues: Issue[] = JSON.parse(localStorage.getItem(KEYS.ISSUES) || '[]');
    const updated = issues.map(i => i.id === id ? { ...i, ...updates } : i);
    localStorage.setItem(KEYS.ISSUES, JSON.stringify(updated));
  },

  deleteIssue: (id: string) => {
    const issues: Issue[] = JSON.parse(localStorage.getItem(KEYS.ISSUES) || '[]');
    const filtered = issues.filter(i => i.id !== id);
    localStorage.setItem(KEYS.ISSUES, JSON.stringify(filtered));
  },

  getMessages: (): Message[] => JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]'),

  getLastSyncTime: (): string | null => localStorage.getItem(KEYS.LAST_SYNC),

  shouldAutoSync: (): boolean => {
    const lastSync = localStorage.getItem(KEYS.LAST_SYNC);
    if (!lastSync) return true;
    const thirtyMinutesMs = 30 * 60 * 1000;
    return (Date.now() - new Date(lastSync).getTime()) > thirtyMinutesMs;
  },

  syncProjectsFromExcel: async (projectUrl: string) => {
    try {
      console.log("Fetching Main Excel from:", projectUrl);
      
      if (typeof XLSX === 'undefined') throw new Error("Excel processing library (SheetJS) failed to load.");

      // --- 1. Fetch Secondary Data (Locate Tickets) First ---
      const locateTicketsMap = new Map<string, string>();
      try {
        console.log("Fetching Locate Tickets from:", LOCATE_TICKETS_URL);
        const locateResponse = await fetch(`${LOCATE_TICKETS_URL}?t=${Date.now()}`);
        if (locateResponse.ok) {
          const locateBuffer = await locateResponse.arrayBuffer();
          const locateWb = XLSX.read(locateBuffer, { type: 'array' });
          if (locateWb.SheetNames.length > 0) {
             const locateSheet = locateWb.Sheets[locateWb.SheetNames[0]];
             
             // Dynamic Header Search for Locate Tickets File
             const rawLocateData = XLSX.utils.sheet_to_json(locateSheet, { header: 1 });
             let headerRowIndex = 0;
             for(let i=0; i < Math.min(rawLocateData.length, 20); i++) {
                const rowStr = JSON.stringify(rawLocateData[i]).toLowerCase();
                // "Map #" is the new project identifier, or look for Ticket headers
                if (rowStr.includes('map #') || rowStr.includes('1st locate ticket')) {
                   headerRowIndex = i;
                   break;
                }
             }
             
             const locateRows = XLSX.utils.sheet_to_json(locateSheet, { range: headerRowIndex, defval: "" });
             
             locateRows.forEach((row: any) => {
                // Project Number comes from 'Map #'
                const ntp = getRowValue(row, ['Map #', 'Map', 'Project', 'Job #']);
                
                if (ntp) {
                   // Extract up to 4 tickets based on specific column names requested
                   const t1 = getRowValue(row, ['1st locate ticket', 'LOCATE TICKET']);
                   const t2 = getRowValue(row, ['2ND TICKET', '2nd locate ticket']);
                   const t3 = getRowValue(row, ['3RD TICKET', '3rd locate ticket']);
                   const t4 = getRowValue(row, ['4TH TICKET', '4th locate ticket']);
                   const phone = getRowValue(row, ['LOCATE NUMBER', 'Phone', 'Number']);
                   
                   const tickets = [t1, t2, t3, t4].filter(t => t && String(t).trim().length > 0);
                   
                   let info = tickets.length > 0 ? tickets.join(', ') : '';
                   
                   if (phone) {
                      info += info ? ` (Ph: ${phone})` : `Ph: ${phone}`;
                   }
                   
                   if (info) {
                      const cleanNtp = ntp.toString().trim().toUpperCase();
                      const existing = locateTicketsMap.get(cleanNtp);
                      // Avoid duplicates if row is repeated
                      if (existing && !existing.includes(info)) {
                           locateTicketsMap.set(cleanNtp, `${existing} | ${info}`);
                      } else if (!existing) {
                           locateTicketsMap.set(cleanNtp, info);
                      }
                   }
                }
             });
          }
        } else {
           console.warn("Could not fetch locate tickets file.");
        }
      } catch (err) {
        console.warn("Locate tickets processing failed", err);
      }

      // --- 2. Process Main Project File ---
      const noCacheUrl = `${projectUrl}?t=${Date.now()}`;
      const response = await fetch(noCacheUrl);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (workbook.SheetNames.length === 0) throw new Error("Excel file is empty");

      // === CONFIGURATION ===
      const targetSheets = [
        "Tillman UG Footage",
        "Completed Projects Pending PW",
        "Projects Pending Tillman QC", 
        "Comp Projects Invoiced-Paid Out"
      ];

      const excludedPhrases = [
        "Repairs",
        "Sent To Biz Ops",
        "Splicing Projects",
        "Maintenance Projects"
      ];
      // =====================

      let allRows: any[] = [];

      workbook.SheetNames.forEach((sheetName: string) => {
        const normalizedSheetName = sheetName.trim().toLowerCase();
        const isTarget = targetSheets.some(t => normalizedSheetName.includes(t.toLowerCase().trim()));

        if (isTarget) {
          console.log(`Processing Sheet: ${sheetName}`);
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (rawData.length > 0) {
            let headerRowIndex = 0;
            // Find header row looking for NTP or Project
            for(let i=0; i < Math.min(rawData.length, 10); i++) {
              const rowStr = JSON.stringify(rawData[i]).toLowerCase();
              if (rowStr.includes('ntp') || rowStr.includes('project')) {
                headerRowIndex = i;
                break;
              }
            }
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { 
              range: headerRowIndex,
              defval: "" 
            });
            allRows = [...allRows, ...sheetData];
          }
        }
      });

      console.log("Total Rows found (pre-filter):", allRows.length);

      const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS_DB) || '[]');
      const assignments: Assignment[] = JSON.parse(localStorage.getItem(KEYS.ASSIGNMENTS) || '[]');
      let newAssignmentsCount = 0;
      let updatedAssignmentsCount = 0;
      let newUsersCount = 0;
      let excludedCount = 0;
      let skippedCount = 0;

      const currentUser = dataService.getCurrentUser();
      const defaultSupervisorId = currentUser?.role === 'supervisor' ? currentUser.id : (users.find(u => u.role === 'supervisor')?.id || 'u1');

      allRows.forEach((row: any) => {
        // 1. Check Exclusions
        const rowString = JSON.stringify(Object.values(row)).toLowerCase();
        const isExcluded = excludedPhrases.some(phrase => rowString.includes(phrase.toLowerCase()));
        if (isExcluded) {
          excludedCount++;
          return;
        }

        // 2. Map Columns (Specific requests added)
        const ntpRaw = getRowValue(row, ['NTP Number', 'NTP', 'Project ID', 'Job #']);
        const vendorNameRaw = getRowValue(row, ['Vendor', 'Crew', 'Assignee', 'Contractor', 'Assigned To']);
        const supervisorNameRaw = getRowValue(row, ['Supervisor', 'Field Super', 'Sup', 'Manager']);
        const projectTitle = getRowValue(row, ['Project Name', 'Job Name', 'Site Name', 'Description']);
        const addressRaw = getRowValue(row, ['Address', 'Location', 'Site Address', 'Street']);
        
        // --- SPECIFIC FOOTAGE MAPPING ---
        const targetFootageRaw = getRowValue(row, ['Footage UG', 'Footage', 'Total Footage']);
        const completedFootageRaw = getRowValue(row, ['Actual Redline Completed Footage UG', 'Actual Redline Completed Footage', 'Completed Footage']);
        const remainingFootageRaw = getRowValue(row, ['Footage Remaining', 'Remaining Footage']);
        // ---------------------------------

        // --- EXTENDED DATA MAPPING ---
        const constructionStatus = getRowValue(row, ['Construction Status', 'Status', 'Constuction Status', 'Current Status']);
        const areaRaw = getRowValue(row, ['AREA', 'Area', 'Zone']);
        const deadlineRaw = getRowValue(row, ['SOW TSD', 'Deadline', 'Due Date']);
        const estCost = getRowValue(row, ['SOW Cost', 'Cost', 'Est Cost']);
        const doorTagRaw = getRowValue(row, ['Door Tag', 'Door Tag Date']);
        const locateDateRaw = getRowValue(row, ['Locate Date', 'Locates']);
        const hhp = getRowValue(row, ['HHP', 'HHP (SAs)']);
        const dateAssignedRaw = getRowValue(row, ['Date Assigned', 'Assigned']);
        const completionDateRaw = getRowValue(row, ['Completion Date', 'Completion']);
        const locateTickets = getRowValue(row, ['Locate Tickets', 'Tickets']);
        const ugPercentageRaw = getRowValue(row, ['UG Percentage Complete', '% Complete']);
        const notesRaw = getRowValue(row, ['Notes', 'Comments', 'Project Notes', 'Status Notes']);
        // -----------------------------

        const market = getRowValue(row, ['Market', 'Region', 'Area', 'Zone']);
        
        if (!ntpRaw) {
          skippedCount++;
          return; 
        }
        
        const ntpNumber = ntpRaw.toString().trim();
        const cleanNtp = ntpNumber.toUpperCase();

        // MERGE LOCATE TICKETS (From second file and main file)
        const extraTickets = locateTicketsMap.get(cleanNtp);
        let finalTickets = locateTickets ? String(locateTickets) : '';
        if (extraTickets) {
            finalTickets = finalTickets ? `${finalTickets}, ${extraTickets}` : extraTickets;
        }

        // 3. Create Crew User if missing
        let crewId = '';
        if (vendorNameRaw) {
          const vNameClean = vendorNameRaw.toString().trim();
          if (vNameClean && vNameClean.toLowerCase() !== 'tbd' && vNameClean.length > 2) {
            let vendorUser = users.find(u => u.name.toLowerCase().includes(vNameClean.toLowerCase()) && u.role === 'crew');

            if (!vendorUser) {
              const newId = `u${Date.now()}${Math.floor(Math.random() * 10000)}`;
              const safeName = vNameClean.replace(/\s+/g, '.').replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
              vendorUser = {
                id: newId,
                name: vNameClean,
                email: `${safeName}@lightspeed.com`,
                role: 'crew',
                market: market || 'General', 
                password: 'Welcome1',
                isTempPassword: true,
                avatar: ''
              };
              users.push(vendorUser);
              newUsersCount++;
            }
            crewId = vendorUser.id;
          }
        }

        // 4. Supervisor Logic - Auto Create if missing
        let supervisorId = defaultSupervisorId;
        if (supervisorNameRaw) {
           const sNameClean = supervisorNameRaw.toString().trim();
           if (sNameClean && sNameClean.toLowerCase() !== 'tbd') {
             let sUser = users.find(u => u.name.toLowerCase().includes(sNameClean.toLowerCase()) && u.role === 'supervisor');
             
             if (!sUser) {
               // Create new supervisor
               const newId = `u${Date.now()}${Math.floor(Math.random() * 10000)}`;
               const safeName = sNameClean.replace(/\s+/g, '.').replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
               sUser = {
                 id: newId,
                 name: sNameClean,
                 email: `${safeName}@lightspeed.com`,
                 role: 'supervisor',
                 market: market || 'General',
                 password: 'Welcome1',
                 isTempPassword: true,
                 avatar: ''
               };
               users.push(sUser);
               newUsersCount++;
               console.log("Created new supervisor:", sNameClean);
             }
             supervisorId = sUser.id;
           }
        }

        // 5. Determine Address
        // User requested: "area = location and should be used for maps"
        // If specific address is missing or "0", try to use Area as the location
        let validAddress = 'Location Pending';
        if (addressRaw && addressRaw !== "0") {
          validAddress = addressRaw;
        } else if (areaRaw && areaRaw !== "0") {
          validAddress = areaRaw.toString();
        }

        const existingIndex = assignments.findIndex(a => a.title.includes(ntpNumber));
        
        // Parse Footage
        const parseFootage = (val: any) => parseInt(String(val || '0').replace(/[^0-9.]/g, '')) || 0;
        const targetFootage = parseFootage(targetFootageRaw);
        let completedFootage = parseFootage(completedFootageRaw);
        const remainingFootage = parseFootage(remainingFootageRaw);

        if (completedFootage === 0 && targetFootage > 0 && remainingFootageRaw !== null && remainingFootageRaw !== undefined && remainingFootageRaw !== "") {
           const calculatedCompleted = Math.max(0, targetFootage - remainingFootage);
           if (calculatedCompleted > 0) completedFootage = calculatedCompleted;
        }
        
        // TITLE FORMAT UPDATE: "Project {NTP}"
        const validTitle = `Project ${ntpNumber}`;
        
        // Use the robust status mapping
        const finalStatus = mapStatus(constructionStatus);

        const extendedDetails = {
          constructionStatus: constructionStatus ? String(constructionStatus) : undefined,
          area: areaRaw ? String(areaRaw) : undefined,
          deadline: excelDateToString(deadlineRaw),
          estimatedCost: estCost ? String(estCost) : undefined,
          doorTagDate: excelDateToString(doorTagRaw),
          locatesDate: excelDateToString(locateDateRaw),
          hhp: hhp ? String(hhp) : undefined,
          dateAssigned: excelDateToString(dateAssignedRaw),
          completionDate: excelDateToString(completionDateRaw),
          locateTickets: finalTickets, // merged tickets
          percentageComplete: formatPercentage(ugPercentageRaw),
          excelNotes: notesRaw ? String(notesRaw) : undefined
        };

        if (existingIndex >= 0) {
          // UPDATE
          const existing = assignments[existingIndex];
          
          // Only auto-update status if Excel has new data that implies completion or start
          let statusToUse = existing.status;
          
          // If the Excel explicitly has a status, use our new robust logic to determine it
          if (constructionStatus) {
             statusToUse = finalStatus;
          }

          const updatedAssignment = {
            ...existing,
            title: validTitle, // Ensure title format is updated
            address: validAddress !== 'Location Pending' ? validAddress : existing.address,
            market: market || existing.market,
            crewId: crewId || existing.crewId,
            supervisorId: supervisorId || existing.supervisorId,
            status: statusToUse, // Update status based on Excel
            metrics: {
              ...existing.metrics,
              targetFootage: targetFootage > 0 ? targetFootage : existing.metrics.targetFootage,
              completedFootage: completedFootage > 0 ? completedFootage : existing.metrics.completedFootage
            },
            extendedDetails: { ...existing.extendedDetails, ...extendedDetails }
          };
          
          // Basic equality check to avoid unnecessary writes
          if (JSON.stringify(existing) !== JSON.stringify(updatedAssignment)) {
             assignments[existingIndex] = updatedAssignment;
             updatedAssignmentsCount++;
          }
        } else {
          // CREATE
          const newAssignment: Assignment = {
            id: `a${Date.now()}${Math.floor(Math.random() * 10000)}`,
            title: validTitle,
            address: validAddress,
            location: { lat: 39.7817, lng: -89.6501 }, // Mock lat/lng, will be overridden by address queries
            crewId: crewId,
            supervisorId: supervisorId,
            market: market || 'General',
            status: finalStatus,
            scheduledDate: new Date().toISOString().split('T')[0],
            description: `Imported via Sync.\nNTP: ${ntpNumber}\nDesc: ${projectTitle || 'No Description'}`,
            metrics: { targetFootage: targetFootage, completedFootage: completedFootage },
            notes: [],
            history: [{ status: finalStatus, timestamp: new Date().toISOString(), updatedBy: 'system', notes: 'Imported via Excel Sync' }],
            extendedDetails: extendedDetails
          };
          assignments.push(newAssignment);
          newAssignmentsCount++;
        }
      });

      console.log(`Sync Stats: New=${newAssignmentsCount}, Updated=${updatedAssignmentsCount}, Users=${newUsersCount}`);

      try {
        localStorage.setItem(KEYS.USERS_DB, JSON.stringify(users));
        localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
        const now = new Date().toISOString();
        localStorage.setItem(KEYS.LAST_SYNC, now);
        return { success: true, newAssignments: newAssignmentsCount, updatedAssignments: updatedAssignmentsCount, newUsers: newUsersCount, timestamp: now };
      } catch (e) {
        return { success: false, error: "Storage full. Could not save all data." };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync' };
    }
  }
};
