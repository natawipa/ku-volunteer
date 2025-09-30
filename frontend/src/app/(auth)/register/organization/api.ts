import { OrganizationFormData } from './types';

export interface OrganizationRegistrationRequest {
  email: string;
  password: string;
  title: string;
  first_name: string;
  last_name: string;
  role: 'organizer';
  organization: string;
  organization_name: string;
}

export interface OrganizationRegistrationResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  redirect_url?: string;
}

export class OrganizationRegistrationService {
  private static readonly API_BASE_URL = 'http://localhost:8000';

  static async register(formData: OrganizationFormData): Promise<OrganizationRegistrationResponse> {
    try {
      const requestData: OrganizationRegistrationRequest = {
        email: formData.email,
        password: formData.password,
        title: formData.title,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'organizer',
        organization: formData.organize,
        organization_name: formData.organizationName,
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

  static async registerWithOAuth(formData: OrganizationFormData, oauthSession: string): Promise<OrganizationRegistrationResponse> {
    try {
      const requestData: OrganizationRegistrationRequest & { oauth_session: string } = {
        email: formData.email,
        password: formData.password,
        title: formData.title,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'organizer',
        organization: formData.organize,
        organization_name: formData.organizationName,
        oauth_session: oauthSession,
      };

      const response = await fetch(`${this.API_BASE_URL}/api/users/oauth-register/`, {
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
          redirect_url: result.redirect_url,
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
