import { StudentFormData } from './types';

export interface StudentRegistrationRequest {
  email: string;
  password: string;
  title: string;
  first_name: string;
  last_name: string;
  role: 'student';
  student_id_external: string;
  year: number;
  faculty: string;
  major: string;
}

export interface StudentRegistrationResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export class StudentRegistrationService {
  private static readonly API_BASE_URL = 'http://localhost:8000';

  static async register(formData: StudentFormData): Promise<StudentRegistrationResponse> {
    try {
      const requestData: StudentRegistrationRequest = {
        email: formData.email,
        password: formData.password,
        title: formData.title,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'student',
        student_id_external: formData.studentID,
        year: formData.year,
        faculty: formData.faculty,
        major: formData.major,
      };

      const response = await fetch(`${this.API_BASE_URL}/api/users/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result,
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: JSON.stringify(error),
        };
      }
    } catch {
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }
}