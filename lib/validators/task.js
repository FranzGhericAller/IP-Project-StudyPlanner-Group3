import { z } from "zod";

// The browser sends an ISO string (or empty). We turn it into a Date or null.
const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Enter a valid date.");

// Used for creating a task and for editing one.
export const taskSchema = z.object({
  title: z.string().trim().min(1, "Task name is required.").max(191, "Task name is too long."),
  subject: z.string().trim().max(60, "Subject is too long.").optional(),
  dueAt: optionalDate,
  priority: z.enum(["HIGH", "MED", "LOW"]),
  notes: z.string().trim().max(5000, "Notes are too long.").optional(),
});

// Used when ticking a task done / not done.
export const taskStatusSchema = z.object({
  status: z.enum(["TODO", "DONE"]),
});

export { optionalDate };