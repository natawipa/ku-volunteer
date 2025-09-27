import { z } from "zod";
import { YEAR_RANGE, STUDENT_ID_LENGTH } from "./types";

export const studentValidationSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter" })
      .regex(/[!#$%^&*()+=\-[\]{};':"\\|,.<>/?]/, { 
        message: "Password must contain at least 1 special character" 
      }),
    confirm: z.string().min(8, { message: "Please enter confirmation password" }),
    title: z.string().min(1, { message: "Please select a title" }),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    studentID: z
      .string()
      .min(STUDENT_ID_LENGTH, { message: `Student ID must be ${STUDENT_ID_LENGTH} digits` })
      .max(STUDENT_ID_LENGTH, { message: `Student ID must be ${STUDENT_ID_LENGTH} digits` }),
    faculty: z.string().min(1, { message: "Faculty is required" }),
    major: z.string().min(1, { message: "Major is required" }),
    year: z
      .number()
      .min(YEAR_RANGE.MIN, { message: `Year must be between ${YEAR_RANGE.MIN}-${YEAR_RANGE.MAX}` })
      .max(YEAR_RANGE.MAX, { message: `Year must be between ${YEAR_RANGE.MIN}-${YEAR_RANGE.MAX}` }),
  })
  .refine((data: { password: string; confirm: string }) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type StudentValidationSchema = z.infer<typeof studentValidationSchema>;