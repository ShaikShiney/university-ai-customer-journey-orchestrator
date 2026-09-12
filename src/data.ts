export type Role = 'admin' | 'agent' | 'marketing' | 'sales' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  programme: string;
  year: number;
  department: string;
  journeyStage: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  engagementScore: number;
  attendance: number;
  gpa: number;
  openTickets: number;
  churnPropensity: number;
  placementReadiness: number;
  email: string;
  phone: string;
  consentEmail: boolean;
  consentSMS: boolean;
  avatar: string;
}

export interface Ticket {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'open' | 'pending' | 'escalated' | 'resolved' | 'closed';
  owner: string;
  created: string;
  sla: string;
  slaBreached: boolean;
  journeyStage: string;
}

export interface Notification {
  id: string;
  type: 'assignment' | 'exception' | 'approval' | 'alert' | 'due_date' | 'ai' | 'system';
  title: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  relatedRecord?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  entity: string;
  entityId: string;
  outcome: 'success' | 'failure' | 'blocked';
  organisation: string;
  details: string;
}

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Dr. Priya Menon', email: 'p.menon@university.edu', role: 'admin', avatar: 'PM', department: 'IT', status: 'active', lastLogin: '2026-09-07 09:14', createdAt: '2023-01-15' },
  { id: 'u2', name: 'James Carter', email: 'j.carter@university.edu', role: 'agent', avatar: 'JC', department: 'Student Services', status: 'active', lastLogin: '2026-09-07 08:52', createdAt: '2023-03-20' },
  { id: 'u3', name: 'Aisha Patel', email: 'a.patel@university.edu', role: 'marketing', avatar: 'AP', department: 'Marketing', status: 'active', lastLogin: '2026-09-06 16:30', createdAt: '2023-05-10' },
  { id: 'u4', name: 'Marcus Webb', email: 'm.webb@university.edu', role: 'sales', avatar: 'MW', department: 'Admissions', status: 'active', lastLogin: '2026-09-07 07:45', createdAt: '2023-02-28' },
  { id: 'u5', name: 'Ananya Sharma', email: 'a.sharma@student.university.edu', role: 'customer', avatar: 'AS', department: 'Computer Science', status: 'active', lastLogin: '2026-09-07 10:02', createdAt: '2023-08-01' },
  { id: 'u6', name: 'Rohan Gupta', email: 'r.gupta@university.edu', role: 'agent', avatar: 'RG', department: 'Academic Affairs', status: 'active', lastLogin: '2026-09-06 14:20', createdAt: '2024-01-05' },
  { id: 'u7', name: 'Sofia Lindqvist', email: 's.lindqvist@university.edu', role: 'agent', avatar: 'SL', department: 'Student Services', status: 'inactive', lastLogin: '2026-08-15 11:00', createdAt: '2023-07-12' },
  { id: 'u8', name: 'Tariq Hassan', email: 't.hassan@university.edu', role: 'marketing', avatar: 'TH', department: 'Marketing', status: 'pending', lastLogin: '—', createdAt: '2026-09-01' },
];

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Ananya Sharma', studentId: 'STU-2026-0142', programme: 'B.Tech Computer Science', year: 3, department: 'Computer Science', journeyStage: 'Placement', riskLevel: 'medium', engagementScore: 82, attendance: 88, gpa: 7.9, openTickets: 2, churnPropensity: 18, placementReadiness: 64, email: 'a.sharma@student.university.edu', phone: '+91 98765 43210', consentEmail: true, consentSMS: false, avatar: 'AS' },
  { id: 's2', name: 'Rahul Reddy', studentId: 'STU-2026-0198', programme: 'B.Tech Electronics', year: 4, department: 'Electronics', journeyStage: 'Graduation', riskLevel: 'low', engagementScore: 91, attendance: 94, gpa: 8.7, openTickets: 0, churnPropensity: 6, placementReadiness: 88, email: 'r.reddy@student.university.edu', phone: '+91 87654 32109', consentEmail: true, consentSMS: true, avatar: 'RR' },
  { id: 's3', name: 'Priya Nair', studentId: 'STU-2025-0076', programme: 'MBA', year: 2, department: 'Business', journeyStage: 'Assessment', riskLevel: 'high', engagementScore: 45, attendance: 62, gpa: 6.2, openTickets: 3, churnPropensity: 52, placementReadiness: 38, email: 'p.nair@student.university.edu', phone: '+91 76543 21098', consentEmail: true, consentSMS: true, avatar: 'PN' },
  { id: 's4', name: 'Arjun Kumar', studentId: 'STU-2026-0211', programme: 'M.Tech AI & Data Science', year: 1, department: 'Computer Science', journeyStage: 'Teaching', riskLevel: 'low', engagementScore: 78, attendance: 82, gpa: 8.1, openTickets: 1, churnPropensity: 12, placementReadiness: 55, email: 'a.kumar@student.university.edu', phone: '+91 65432 10987', consentEmail: false, consentSMS: false, avatar: 'AK' },
  { id: 's5', name: 'Sneha Rao', studentId: 'STU-2025-0089', programme: 'B.Tech Computer Science', year: 4, department: 'Computer Science', journeyStage: 'Placement', riskLevel: 'critical', engagementScore: 31, attendance: 54, gpa: 5.8, openTickets: 4, churnPropensity: 71, placementReadiness: 22, email: 's.rao@student.university.edu', phone: '+91 54321 09876', consentEmail: true, consentSMS: false, avatar: 'SR' },
];

export const MOCK_TICKETS: Ticket[] = [
  { id: 'TKT-2026-0841', studentId: 's1', studentName: 'Ananya Sharma', subject: 'Placement portal registration error', category: 'Placement', priority: 'high', status: 'open', owner: 'James Carter', created: '2026-09-05 14:32', sla: '2026-09-08 14:32', slaBreached: false, journeyStage: 'Placement' },
  { id: 'TKT-2026-0839', studentId: 's3', studentName: 'Priya Nair', subject: 'Grade dispute — Business Analytics module', category: 'Assessment', priority: 'high', status: 'escalated', owner: 'Rohan Gupta', created: '2026-09-04 09:11', sla: '2026-09-06 09:11', slaBreached: true, journeyStage: 'Assessment' },
  { id: 'TKT-2026-0835', studentId: 's5', studentName: 'Sneha Rao', subject: 'Cannot access course materials for CS401', category: 'Course Registration', priority: 'critical', status: 'escalated', owner: 'James Carter', created: '2026-09-03 16:45', sla: '2026-09-05 16:45', slaBreached: true, journeyStage: 'Teaching' },
  { id: 'TKT-2026-0829', studentId: 's4', studentName: 'Arjun Kumar', subject: 'Timetable clash — AI Ethics vs ML Lab', category: 'Timetable Planning', priority: 'medium', status: 'pending', owner: 'Rohan Gupta', created: '2026-09-02 11:20', sla: '2026-09-09 11:20', slaBreached: false, journeyStage: 'Timetable Planning' },
  { id: 'TKT-2026-0820', studentId: 's2', studentName: 'Rahul Reddy', subject: 'Final transcript request for graduation', category: 'Graduation', priority: 'low', status: 'resolved', owner: 'Sofia Lindqvist', created: '2026-08-28 10:05', sla: '2026-09-04 10:05', slaBreached: false, journeyStage: 'Graduation' },
  { id: 'TKT-2026-0818', studentId: 's3', studentName: 'Priya Nair', subject: 'Leave of absence application', category: 'Administrative', priority: 'medium', status: 'new', owner: 'Unassigned', created: '2026-09-07 08:30', sla: '2026-09-10 08:30', slaBreached: false, journeyStage: 'Assessment' },
  { id: 'TKT-2026-0815', studentId: 's5', studentName: 'Sneha Rao', subject: 'Attendance regularisation request', category: 'Academic', priority: 'high', status: 'open', owner: 'James Carter', created: '2026-09-01 13:50', sla: '2026-09-08 13:50', slaBreached: false, journeyStage: 'Teaching' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'ai', title: 'AI Recommendation Pending Review', description: 'High-confidence placement follow-up recommendation for Sneha Rao requires approval.', timestamp: '10 min ago', severity: 'warning', read: false, relatedRecord: 'REC-2026-0112' },
  { id: 'n2', type: 'alert', title: 'SLA Breach — TKT-2026-0839', description: 'Grade dispute ticket for Priya Nair has exceeded SLA by 22 hours.', timestamp: '1 hr ago', severity: 'critical', read: false, relatedRecord: 'TKT-2026-0839' },
  { id: 'n3', type: 'approval', title: 'Campaign Approval Required', description: 'Placement workshop outreach campaign awaiting your approval before send.', timestamp: '2 hrs ago', severity: 'warning', read: false, relatedRecord: 'CAMP-2026-0044' },
  { id: 'n4', type: 'alert', title: 'Churn Risk Spike — Priya Nair', description: 'Churn propensity for Priya Nair increased from 38% to 52% in the last 7 days.', timestamp: '3 hrs ago', severity: 'critical', read: false, relatedRecord: 'STU-2025-0076' },
  { id: 'n5', type: 'system', title: 'AI Model Updated', description: 'Placement propensity model updated to v2.4.1. Predictions may differ slightly from previous results.', timestamp: '5 hrs ago', severity: 'info', read: true },
  { id: 'n6', type: 'assignment', title: 'Ticket Assigned to You', description: 'TKT-2026-0841 (Ananya Sharma — Placement portal error) assigned to you.', timestamp: '1 day ago', severity: 'info', read: true, relatedRecord: 'TKT-2026-0841' },
  { id: 'n7', type: 'due_date', title: 'Follow-up Due Tomorrow', description: 'Scheduled advisor follow-up for Arjun Kumar is due 2026-09-08.', timestamp: '1 day ago', severity: 'warning', read: true },
  { id: 'n8', type: 'ai', title: 'New AI Predictions Ready', description: 'Churn propensity predictions updated for 847 active students.', timestamp: '2 days ago', severity: 'info', read: true },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', timestamp: '2026-09-07 10:14:32', user: 'James Carter', role: 'agent', action: 'Data Access', entity: 'Student Profile', entityId: 'STU-2026-0142', outcome: 'success', organisation: 'Student Services', details: 'Viewed profile for Ananya Sharma' },
  { id: 'al2', timestamp: '2026-09-07 10:08:11', user: 'Dr. Priya Menon', role: 'admin', action: 'Configuration Change', entity: 'AI Settings', entityId: 'ai-conf-001', outcome: 'success', organisation: 'IT', details: 'Updated confidence threshold from 0.80 to 0.85' },
  { id: 'al3', timestamp: '2026-09-07 09:55:44', user: 'Aisha Patel', role: 'marketing', action: 'Approval', entity: 'Campaign', entityId: 'CAMP-2026-0044', outcome: 'success', organisation: 'Marketing', details: 'Approved placement workshop outreach campaign' },
  { id: 'al4', timestamp: '2026-09-07 09:41:20', user: 'James Carter', role: 'agent', action: 'Update', entity: 'Ticket', entityId: 'TKT-2026-0841', outcome: 'success', organisation: 'Student Services', details: 'Changed ticket status from New to Open' },
  { id: 'al5', timestamp: '2026-09-07 09:22:05', user: 'Marcus Webb', role: 'sales', action: 'Override', entity: 'AI Recommendation', entityId: 'REC-2026-0108', outcome: 'success', organisation: 'Admissions', details: 'Overrode AI recommendation — reason: student already contacted via alternate channel' },
  { id: 'al6', timestamp: '2026-09-07 09:10:33', user: 'Rohan Gupta', role: 'agent', action: 'Login', entity: 'System', entityId: 'session-7f2a', outcome: 'success', organisation: 'Academic Affairs', details: 'Successful login from 10.20.4.102' },
  { id: 'al7', timestamp: '2026-09-07 08:55:17', user: 'Unknown', role: 'customer', action: 'Login', entity: 'System', entityId: 'session-fail', outcome: 'failure', organisation: '—', details: 'Failed login attempt — invalid credentials for r.reddy@student.university.edu' },
  { id: 'al8', timestamp: '2026-09-07 08:44:09', user: 'Aisha Patel', role: 'marketing', action: 'Export', entity: 'Segment', entityId: 'SEG-2026-0018', outcome: 'success', organisation: 'Marketing', details: 'Exported segment data — 312 records' },
];

export const JOURNEY_STAGES = [
  { name: 'Admission', key: 'admission', color: '#6366f1' },
  { name: 'Course Registration', key: 'registration', color: '#8b5cf6' },
  { name: 'Timetable Planning', key: 'timetable', color: '#0ea5e9' },
  { name: 'Teaching', key: 'teaching', color: '#10b981' },
  { name: 'Assessment', key: 'assessment', color: '#f59e0b' },
  { name: 'Research Admin', key: 'research', color: '#f97316' },
  { name: 'Placement', key: 'placement', color: '#ef4444' },
  { name: 'Graduation', key: 'graduation', color: '#059669' },
];

export const PERMISSIONS: Record<string, Record<Role, boolean>> = {
  'View Profiles': { admin: true, agent: true, marketing: false, sales: true, customer: false },
  'Edit Profiles': { admin: true, agent: true, marketing: false, sales: false, customer: false },
  'Manage Tickets': { admin: true, agent: true, marketing: false, sales: false, customer: false },
  'Create Campaigns': { admin: true, agent: false, marketing: true, sales: true, customer: false },
  'View AI Recommendations': { admin: true, agent: true, marketing: true, sales: true, customer: false },
  'Approve Recommendations': { admin: true, agent: false, marketing: true, sales: true, customer: false },
  'View Reports': { admin: true, agent: true, marketing: true, sales: true, customer: false },
  'Manage Users': { admin: true, agent: false, marketing: false, sales: false, customer: false },
  'View Audit Logs': { admin: true, agent: false, marketing: false, sales: false, customer: false },
  'System Settings': { admin: true, agent: false, marketing: false, sales: false, customer: false },
  'View Own Profile': { admin: true, agent: true, marketing: true, sales: true, customer: true },
  'View My Journey': { admin: false, agent: false, marketing: false, sales: false, customer: true },
  'Submit Tickets': { admin: true, agent: true, marketing: true, sales: true, customer: true },
};
