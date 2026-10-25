import { z } from "zod";
import { optionalDate } from "@/lib/validators/task";

export const studySchema = z.object({
  minutes: z.coerce
    .number({ error: "Enter the minutes studied." })
    .int("Use whole minutes.")
    .min(1, "Enter at least 1 minute.")
    .max(1440, "That is more than 24 hours."),
  // Blank = "now"
  startedAt: optionalDate,
  subject: z.string().trim().max(60, "Subject is too long.").optional(),
  taskId: z.string().optional(),
});