
export type UserRole = 'executive' | 'manager' | 'supervisor' | 'crew';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  market?: string;
  // Auth fields
  password?: string;
  isTempPassword?: boolean;
}

export type AssignmentStatus = 'pending' | 'en_route' | 'started' | 'blocked' | 'completed';

export interface AssignmentHistoryEntry {
  status: AssignmentStatus;
  timestamp: string;
  updatedBy: string;
  notes?: string;
  footage?: number;
  photos?: string[]; // Base64 strings
}

export interface ExtendedDetails {
  constructionStatus?: string;
  area?: string;
  deadline?: string;
  estimatedCost?: string;
  doorTagDate?: string;
  locatesDate?: string;
  hhp?: string;
  dateAssigned?: string;
  completionDate?: string;
  locateTickets?: string;
  percentageComplete?: string;
  projectHealth?: string;
  excelNotes?: string; // New field for Excel notes
}

export interface Assignment {
  id: string;
  title: string;
  address: string;
  location: { lat: number; lng: number };
  crewId: string;
  supervisorId: string;
  market?: string; 
  status: AssignmentStatus;
  scheduledDate: string;
  description: string;
  metrics: {
    targetFootage: number;
    completedFootage: number;
  };
  notes: string[];
  history: AssignmentHistoryEntry[];
  extendedDetails?: ExtendedDetails; // New field for expanded excel data
}

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'investigating' | 'resolved';

export interface Issue {
  id: string;
  assignmentId: string;
  reportedBy: string;
  type: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
  timestamp: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  channel: string;
  read: boolean;
}