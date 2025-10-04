import { z } from "zod";

export const deleteEventRequestValidationSchema = z
  .object({
    title: z.string().min(1, { message: "Please enter a event title" }),
    reason: z.string().min(1, { message: "Please enter a reason for delete confirmation" }),
  })

export type deleteEventRequestValidationSchema = z.infer<typeof deleteEventRequestValidationSchema>;
