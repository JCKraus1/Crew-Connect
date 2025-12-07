
import { User, Assignment, Issue, Message } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Supervisor', email: 'alex@lightspeed.com', role: 'supervisor', market: 'North Market' },
  { id: 'u2', name: 'Sarah Crew Lead', email: 'sarah@lightspeed.com', role: 'crew', market: 'North Market' },
  { id: 'u3', name: 'Mike Manager', email: 'mike@lightspeed.com', role: 'manager', market: 'North Market' },
  { id: 'u4', name: 'John Exec', email: 'john@lightspeed.com', role: 'executive' },
  { id: 'u5', name: 'David Crew', email: 'david@lightspeed.com', role: 'crew', market: 'North Market' },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a1',
    title: 'Fiber Drop - 123 Maple St',
    address: '123 Maple St, Springfield',
    location: { lat: 39.7817, lng: -89.6501 },
    crewId: 'u2',
    supervisorId: 'u1',
    status: 'en_route',
    scheduledDate: new Date().toISOString().split('T')[0],
    description: 'Install 200ft drop to residential premise. Watch for dog in backyard.',
    metrics: { targetFootage: 200, completedFootage: 0 },
    notes: [],
    history: [
      {
        status: 'pending',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        updatedBy: 'u1',
        notes: 'Assignment created'
      },
      {
        status: 'en_route',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        updatedBy: 'u2',
        notes: 'Heading to site'
      }
    ]
  },
  {
    id: 'a2',
    title: 'Mainline Repair - 5th Ave',
    address: '450 5th Ave, Springfield',
    location: { lat: 39.7820, lng: -89.6510 },
    crewId: 'u2',
    supervisorId: 'u1',
    status: 'pending',
    scheduledDate: new Date().toISOString().split('T')[0],
    description: 'Repair damaged conduit. Traffic control required.',
    metrics: { targetFootage: 50, completedFootage: 0 },
    notes: [],
    history: [
      {
        status: 'pending',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        updatedBy: 'u1',
        notes: 'Assignment created'
      }
    ]
  },
  {
    id: 'a3',
    title: 'Cabinet Install - Oak Park',
    address: 'Oak Park Entrance',
    location: { lat: 39.7900, lng: -89.6600 },
    crewId: 'u2',
    supervisorId: 'u1',
    status: 'completed',
    scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    description: 'Set PFP cabinet and ground.',
    metrics: { targetFootage: 0, completedFootage: 0 },
    notes: ['Completed ahead of schedule.'],
    history: [
       {
        status: 'pending',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        updatedBy: 'u1'
      },
      {
        status: 'completed',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        updatedBy: 'u2',
        notes: 'All done.'
      }
    ]
  }
];

export const MOCK_ISSUES: Issue[] = [
  {
    id: 'i1',
    assignmentId: 'a2',
    reportedBy: 'u2',
    type: 'Access Problem',
    description: 'Gate is locked, owner not answering phone.',
    priority: 'high',
    status: 'open',
    timestamp: new Date().toISOString()
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'u1',
    senderName: 'Alex Supervisor',
    content: 'Team, remember safety brief at 7am tomorrow.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    channel: 'Market 1',
    read: true
  },
  {
    id: 'm2',
    senderId: 'u3',
    senderName: 'Mike Manager',
    content: 'New equipment arriving Thursday.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    channel: 'Market 1',
    read: false
  }
];