// Helpers for the API routes in app/api (server side only).
// Every route pretty much does the same 4 things:
//   1) check login  2) read the body  3) validate w/ zod  4) save/read w/ prisma
import { auth } from "@/lib/auth";

// logged in user's id, or null if not logged in.
// always get the user from the session, never trust a userId sent in the body
export async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

// returns null if the body is empty or not valid JSON
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// zod errors -> { field: "msg" } so the form can show each msg under its input
export function toFieldErrors(error) {
  const errors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

// common responses (number = HTTP status code)
export const unauthorized = () =>
  Response.json({ message: "Not signed in." }, { status: 401 });

export const badRequest = (message = "Invalid request.") =>
  Response.json({ message }, { status: 400 });

export const validationError = (error) =>
  Response.json({ errors: toFieldErrors(error) }, { status: 400 });

export const notFound = () =>
  Response.json({ message: "Not found." }, { status: 404 });

export const serverError = () =>
  Response.json({ message: "Something went wrong. Try again." }, { status: 500 });
