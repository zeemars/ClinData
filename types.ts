
export interface Trial {
  id: number;
  department: string;
  pi: string;
  title: string;
  disease: string;
  tags: string[];
  criteria: string;
  contact: string;
}

export interface SearchState {
  query: string;
  results: Trial[];
}

export interface LogEntry {
  id: number;
  created_at: string;
  user_id: string;
  user_email: string;
  action: string;
  details: any;
}

// Global user role definition
export type UserRole = 'super_admin' | 'data_admin';
