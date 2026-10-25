import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(191, "Title is too long."),
    subject: z.string().trim().max(60, "Subject is too long.").optional(),
    description: z.string().trim().max(5000, "Description is too long.").optional(),
    startAt: z.coerce.date({ error: "Enter a valid start time." }),
    endAt: z.coerce.date({ error: "Enter a valid end time." }),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "End must be after the start.",
    path: ["endAt"],
  });