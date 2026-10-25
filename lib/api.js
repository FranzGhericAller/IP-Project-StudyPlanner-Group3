import { auth } from "@/lib/auth";
import { toFieldErrors } from "@/lib/validators/authSchema";

// The logged-in user's id, or null.
// Always take the user from the session, never from the request body.
export async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Reads the JSON body, or returns null if it is missing or invalid.
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const unauthorized = () => Response.json({ message: "Not signed in." }, { status: 401 });
export const badRequest = (message = "Invalid request.") =>
  Response.json({ message }, { status: 400 });
export const notFound = () => Response.json({ message: "Not found." }, { status: 404 });
export const serverError = () =>
  Response.json({ message: "Something went wrong. Try again." }, { status: 500 });
export const validationError = (error) =>
  Response.json({ errors: toFieldErrors(error) }, { status: 400 });