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

  getMessages: (): Message[] => JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]'),

  getLastSyncTime: (): string | null => localStorage.getItem(KEYS.LAST_SYNC),

  shouldAutoSync: (): boolean => {
    const lastSync = localStorage.getItem(KEYS.LAST_SYNC);
    if (!lastSync) return true;
    const thirtyMinutesMs = 30 * 60 * 1000;
    return (Date.now() - new Date(lastSync).getTime()) > thirtyMinutesMs;
  },

  syncProjectsFromExcel: async (url: string) => {
    try {
      console.log("Fetching Excel from:", url);
      
      if (typeof XLSX === 'undefined') throw new Error("Excel processing library (SheetJS) failed to load.");

      const noCacheUrl = `${url}?t=${Date.now()}`;
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
        const supervisorName = getRowValue(row, ['Supervisor', 'Field Super', 'Sup', 'Manager']);
        const projectTitle = getRowValue(row, ['Project Name', 'Job Name', 'Site Name', 'Description']);
        const address = getRowValue(row, ['Address', 'Location', 'Site Address', 'Street']);
        
        // --- SPECIFIC FOOTAGE MAPPING ---
        const targetFootageRaw = getRowValue(row, ['Footage UG', 'Footage', 'Total Footage']);
        const completedFootageRaw = getRowValue(row, ['Actual Redline Completed Footage UG', 'Actual Redline Completed Footage', 'Completed Footage']);
        const remainingFootageRaw = getRowValue(row, ['Footage Remaining', 'Remaining Footage']);
        // ---------------------------------

        // --- EXTENDED DATA MAPPING ---
        const constructionStatus = getRowValue(row, ['Construction Status', 'Status', 'Constuction Status']);
        const area = getRowValue(row, ['AREA', 'Area', 'Zone']);
        const deadline = getRowValue(row, ['SOW TSD', 'Deadline', 'Due Date']);
        const estCost = getRowValue(row, ['SOW Cost', 'Cost', 'Est Cost']);
        const doorTag = getRowValue(row, ['Door Tag', 'Door Tag Date']);
        const locateDate = getRowValue(row, ['Locate Date', 'Locates']);
        const hhp = getRowValue(row, ['HHP', 'HHP (SAs)']);
        const dateAssigned = getRowValue(row, ['Date Assigned', 'Assigned']);
        const completionDate = getRowValue(row, ['Completion Date', 'Completion']);
        const locateTickets = getRowValue(row, ['Locate Tickets', 'Tickets']);
        const ugPercentage = getRowValue(row, ['UG Percentage Complete', '% Complete']);
        // -----------------------------

        const market = getRowValue(row, ['Market', 'Region', 'Area', 'Zone']);
        
        if (!ntpRaw) {
          skippedCount++;
          return; 
        }
        
        const ntpNumber = ntpRaw.toString().trim();

        // 3. Create User if missing
        let crewId = '';
        if (vendorNameRaw) {
          const vNameClean = vendorNameRaw.toString().trim();
          if (vNameClean && vNameClean.toLowerCase() !== 'tbd' && vNameClean.length > 2) {
            let vendorUser = users.find(u => u.name.toLowerCase().includes(vNameClean.toLowerCase()));

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

        // 4. Supervisor Logic
        let supervisorId = defaultSupervisorId;
        if (supervisorName) {
           const sUser = users.find(u => u.name.toLowerCase().includes(supervisorName.toString().toLowerCase()) && u.role === 'supervisor');
           if (sUser) supervisorId = sUser.id;
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
        
        const validAddress = address && address !== "0" ? address : 'Location Pending';
        const validTitle = projectTitle || `Project ${ntpNumber}`;

        const extendedDetails = {
          constructionStatus: constructionStatus ? String(constructionStatus) : undefined,
          area: area ? String(area) : undefined,
          deadline: deadline ? String(deadline) : undefined,
          estimatedCost: estCost ? String(estCost) : undefined,
          doorTagDate: doorTag ? String(doorTag) : undefined,
          locatesDate: locateDate ? String(locateDate) : undefined,
          hhp: hhp ? String(hhp) : undefined,
          dateAssigned: dateAssigned ? String(dateAssigned) : undefined,
          completionDate: completionDate ? String(completionDate) : undefined,
          locateTickets: locateTickets ? String(locateTickets) : undefined,
          percentageComplete: ugPercentage ? String(ugPercentage) : undefined
        };

        if (existingIndex >= 0) {
          // UPDATE
          const existing = assignments[existingIndex];
          const updatedAssignment = {
            ...existing,
            address: validAddress !== 'Location Pending' ? validAddress : existing.address,
            market: market || existing.market,
            crewId: crewId || existing.crewId,
            supervisorId: supervisorId || existing.supervisorId,
            metrics: {
              ...existing.metrics,
              targetFootage: targetFootage > 0 ? targetFootage : existing.metrics.targetFootage,
              completedFootage: completedFootage > 0 ? completedFootage : existing.metrics.completedFootage
            },
            extendedDetails: { ...existing.extendedDetails, ...extendedDetails }
          };
          if (JSON.stringify(existing) !== JSON.stringify(updatedAssignment)) {
             assignments[existingIndex] = updatedAssignment;
             updatedAssignmentsCount++;
          }
        } else {
          // CREATE
          const newAssignment: Assignment = {
            id: `a${Date.now()}${Math.floor(Math.random() * 10000)}`,
            title: `NTP: ${ntpNumber} - ${validTitle}`,
            address: validAddress,
            location: { lat: 39.7817, lng: -89.6501 },
            crewId: crewId,
            supervisorId: supervisorId,
            market: market || 'General',
            status: 'pending',
            scheduledDate: new Date().toISOString().split('T')[0],
            description: `Imported via Sync.\nNTP: ${ntpNumber}\nDesc: ${validTitle}`,
            metrics: { targetFootage: targetFootage, completedFootage: completedFootage },
            notes: [],
            history: [{ status: 'pending', timestamp: new Date().toISOString(), updatedBy: 'system', notes: 'Imported via Excel Sync' }],
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