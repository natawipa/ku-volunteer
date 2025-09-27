export interface StudentFormData {
  email: string;
  password: string;
  confirm: string;
  title: string;
  firstName: string;
  lastName: string;
  studentID: string;
  faculty: string;
  major: string;
  year: number;
}

export const TITLE_OPTIONS = ["Mr.", "Mrs.", "Ms."] as const;
export type TitleOption = typeof TITLE_OPTIONS[number];

export const YEAR_RANGE = { MIN: 1, MAX: 6 } as const;
export const STUDENT_ID_LENGTH = 10 as const;