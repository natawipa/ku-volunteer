export interface User {
  id: number;
  email: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Activity types
export interface Activity {
  id: number;
  organizer_profile_id: number;
  organizer_email: string;
  organizer_name: string;
  categories: string[];
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
  max_participants?: number;
  current_participants: number;
  status: string;
  hours_awarded?: number;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  requires_admin_for_delete: boolean;
  capacity_reached: boolean;
  cover_image_url?: string;
  cover_image?: string;
}

export interface ActivityApplication {
  id: number;
  activity: number | null; // Activity ID (null if activity was deleted)
  activity_id?: number; // serialized data
  activity_title?: string;
  activity_id_stored?: number; // Stored activity ID (persists after deletion)
  studentid: number;
  student_email?: string; // For serialized data
  student_name?: string; // For serialized data
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submitted_at: string;
  decision_at?: string;
  decision_by?: number; 
  decision_by_email?: string; // For serialized data
  notes?: string; // Matches your backend 'notes' field (was review_note)
}

export interface CreateApplicationRequest {
  activity: number; 
}

// Application review request (for organizers)
export interface ReviewApplicationRequest {
  action: 'approve' | 'reject';
  reason?: string;
}

export interface ActivityApplicationWithUser extends ActivityApplication {
  student_details: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    student_id_external?: string;
    faculty?: string;
    major?: string;
    year?: number;
  };
}

export interface ActivityWithApplicationStatus extends Activity {
  user_application_status: 'pending' | 'approved' | 'rejected' | 'cancelled' | null;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  role: string;
  // Student specific fields
  student_id_external?: string;
  year?: number;
  faculty?: string;
  major?: string;
  // Organizer specific fields
  organization_type?: string;
  organization_name?: string;
}

// Event card props (legacy from current implementation)
export interface EventCardProps {
  title: string;
  post: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  category?: string[];
  imgSrc: string;
  status?: string;
  capacity: number;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// Error types
export interface ApiError {
  detail?: string;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// Component prop types
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApplicationAction = 'approve' | 'reject';

// may be add the stat but later
export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

// Event types for form handlers
export type FormEvent = React.FormEvent<HTMLFormElement>;
export type InputEvent = React.ChangeEvent<HTMLInputElement>;
export type TextAreaEvent = React.ChangeEvent<HTMLTextAreaElement>;
export type SelectEvent = React.ChangeEvent<HTMLSelectElement>;