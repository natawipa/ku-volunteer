import { z } from "zod";

export const organizationValidationSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter" })
      .regex(/[!#$%^&*()+=\-[\]{};':"\\|,.<>/?]/, { 
        message: "Password must contain at least 1 special character" 
      }),
    confirm: z.string().min(1, { message: "Please enter confirmation password" }),
    organize: z.string().min(1, { message: "Please select an organization" }),
    title: z.string().min(1, { message: "Please select a title" }),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    organizationName: z.string().min(1, { message: "Organization name is required" }),
  })
  .refine((data: { password: string; confirm: string }) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type OrganizationValidationSchema = z.infer<typeof organizationValidationSchema>;
