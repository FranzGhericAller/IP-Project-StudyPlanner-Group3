import { z } from "zod";

// Zod rules for everything sent to the API.
// Routes call schema.safeParse(body). If it fails, the msgs get sent back to the form.

// trim + lowercase first, then check the format
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

const subject = z.string().trim().max(60, "Subject is too long.").optional();

// browser sends an ISO string or "" -> we turn it into a Date or null
const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Enter a valid date.");

// ---- accounts ----

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
  email,
  // bcrypt only reads the first 72 chars anyway
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Use at most 72 characters."),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
});

// ---- tasks ----

// same rules for add and edit
export const taskSchema = z.object({
  title: z.string().trim().min(1, "Task name is required.").max(191, "Task name is too long."),
  subject,
  dueAt: optionalDate,
  priority: z.enum(["HIGH", "MED", "LOW"]),
  notes: z.string().trim().max(5000, "Notes are too long.").optional(),
});

export const taskStatusSchema = z.object({
  status: z.enum(["TODO", "DONE"]),
});

// ---- events ----

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(191, "Title is too long."),
    subject,
    description: z.string().trim().max(5000, "Description is too long.").optional(),
    startAt: z.coerce.date({ error: "Enter a valid start time." }),
    endAt: z.coerce.date({ error: "Enter a valid end time." }),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "End must be after the start.",
    path: ["endAt"],
  });

// ---- study sessions ----

export const studySchema = z.object({
  minutes: z.coerce
    .number({ error: "Enter the minutes studied." })
    .int("Use whole minutes.")
    .min(1, "Enter at least 1 minute.")
    .max(1440, "That is more than 24 hours."),
  startedAt: optionalDate, // blank = now
  subject,
  taskId: z.string().optional(),
});
