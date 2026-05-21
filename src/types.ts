export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  capacity: number;
  status: 'draft' | 'published' | 'cancelled';
  created_at: string;
  updated_at: string;
  registration_count: number;
}

export interface Registration {
  id: string;
  event_id: string;
  name: string;
  email: string;
  created_at: string;
}
