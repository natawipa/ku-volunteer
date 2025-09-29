export interface OrganizationFormData {
  email: string;
  password: string;
  confirm: string;
  organize: string;
  title: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export const TITLE_OPTIONS = ["Mr.", "Mrs.", "Ms."] as const;
export type TitleOption = typeof TITLE_OPTIONS[number];

export const ORGANIZATION_OPTIONS = ["Kasetsart University", "External Organization"] as const;
export type OrganizationOption = typeof ORGANIZATION_OPTIONS[number];
