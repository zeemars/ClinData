
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
