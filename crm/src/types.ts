export type UserRole = 'admin' | 'telecaller' | 'counselor' | 'partner';

export type HubId = 'CALLER_1' | 'CALLER_2' | 'CALLER_3' | 'ALL';

export interface User {
  id?: string;
  pin: string;
  name: string;
  role: UserRole;
  hub: HubId;
  phone?: string;
}

export type CenterStatus = 'Eager' | 'FollowUp' | 'Cold' | 'Partnered' | 'New' | 'Rejected';

export interface CenterNote {
  date: string;
  text: string;
  author?: string;
}

export interface Center {
  id: string;
  name: string;
  district: string;
  phone: string;
  url?: string;
  link?: string;
  status: CenterStatus;
  priority: 'High' | 'Medium' | 'Low';
  lastContact?: string;
  followUpDate?: string;
  employee?: string;
  directorName?: string;
  contactPerson?: string;
  truecallerName?: string;
  truecallerResolvedAt?: string;
  notes: CenterNote[];
  studentCount?: number;
  referredStudents?: number;
  updated_at?: string;
}

export interface CallLog {
  id?: string;
  partner_id: string;
  caller_pin: string;
  caller_name: string;
  status: string;
  notes: string;
  callback_date?: string;
  created_at?: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'dispatched';

export interface ProposalReviewItem {
  id: string;
  partner_id: string;
  partner_name: string;
  district: string;
  phone: string;
  director_name?: string;
  submitted_by_caller_name?: string;
  submitted_by_caller_pin?: string;
  caller_notes?: string;
  status: ReviewStatus;
  reviewed_by_user_id?: string;
  reviewed_at?: string;
  review_notes?: string;
  whatsapp_dispatched_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface HubConfig {
  id: HubId;
  name: string;
  callerPin?: string;
  desc: string;
  districts: string[];
}
