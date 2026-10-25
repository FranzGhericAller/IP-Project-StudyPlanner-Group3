import { z } from "zod";

// Trim, lowercase, then check it looks like an email.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
  email,
  // bcrypt only uses the first 72 bytes, so cap the length there.
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Use at most 72 characters."),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
});

// Turns Zod issues into { fieldName: "message" } for the forms.
export function toFieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}