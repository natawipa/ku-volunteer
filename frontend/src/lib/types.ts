/** ===============================
 *  USER & AUTH TYPES
 *  =============================== */

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

  // Student fields
  student_id_external?: string;
  year?: number;
  faculty?: string;
  major?: string;

  // Organizer fields
  organization_type?: string;
  organization_name?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

/** ===============================
 *  EVENT TYPES
 *  =============================== */

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
  status: string;
  created_at: string;
  updated_at: string;

  // Optional details
  max_participants?: number;
  current_participants: number;
  hours_awarded?: number;
  rejection_reason?: string;
  requires_admin_for_delete: boolean;
  capacity_reached: boolean;
  cover_image_url?: string;
  cover_image?: string;
  deleted?: boolean;
  is_draft?: boolean;
  organizer?: string;
  participants?: number[];
  applications?: ActivityApplication[];
}

export interface ActivityWithApplicationStatus extends Activity {
  user_application_status: ApplicationStatus | null;
}

/** ===============================
 *  APPLICATION TYPES
 *  =============================== */

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApplicationAction = 'approve' | 'reject';

export interface ActivityApplication {
  id: number;
  activity: number | null; // Activity ID (null if activity was deleted)
  activity_id?: number; // serialized data
  activity_title?: string;
  activity_id_stored?: number; // Stored activity ID (persists after deletion)

  studentid: number;
  student_email?: string;
  student_name?: string;
  student_id_external?: string;

  status: ApplicationStatus;
  submitted_at: string;
  decision_at?: string;
  decision_by?: number;
  decision_by_email?: string;
  notes?: string; // Replaces review_note
  review_note?: string; // Deprecated backend field
  cancelled_at?: string;
  cancelled_by?: number;
}

export interface CreateApplicationRequest {
  activity: number;
}

export interface ReviewApplicationRequest {
  action: ApplicationAction;
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

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

/** ===============================
 *  UI / COMPONENT PROP TYPES
 *  =============================== */

export interface EventCardProps {
  id: string | number;
  title: string;
  description: string;
  category: string | string[];
  dateStart: string;
  dateEnd: string;
  location: string;
  organizer: string;
  participants_count: number;
  max_participants: number;
  posted_at?: string;
  imgSrc?: string;
  status?: string;
  cover_image_url?: string;
  cover_image?: string;
  current_participants?: number;
}

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

/** ===============================
 *  API RESPONSE & ERROR TYPES
 *  =============================== */

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

export interface ApiError {
  detail?: string;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/** ===============================
 *  FORM HANDLING & VALIDATION
 *  =============================== */

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

export interface CheckInRecord {
  id: number;
  student: number;
  student_name: string;
  student_email: string;
  attendance_status: 'present' | 'absent' | 'pending';
  checked_in_at: string; // ISO datetime string
  check_in_code: string;
  activity: number;
}


/** ===============================
 *  DOM EVENT TYPES
 *  =============================== */

export type FormEvent = React.FormEvent<HTMLFormElement>;
export type InputEvent = React.ChangeEvent<HTMLInputElement>;
export type TextAreaEvent = React.ChangeEvent<HTMLTextAreaElement>;
export type SelectEvent = React.ChangeEvent<HTMLSelectElement>;
