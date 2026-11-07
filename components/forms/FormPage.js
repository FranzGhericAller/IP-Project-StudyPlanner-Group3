import Link from "next/link";
import BackLink from "@/components/common/BackLink";
import Alert from "@/components/common/Alert";

// Shared layout for the add/edit forms (top bar, card, error msg, Cancel + Save).
// Each form just passes its own fields as children.
export default function FormPage({
  pageTitle,
  heading,
  onSubmit,
  error,
  loading,
  submitLabel,
  children,
}) {
  return (
    <div className="min-h-screen">
      <BackLink title={pageTitle} />
      <div className="flex justify-center pt-12 px-6">
        <form
          onSubmit={onSubmit}
          noValidate
          className="w-full max-w-md bg-white rounded-lg border p-8"
        >
          <h2 className="font-semibold text-lg mb-6">{heading}</h2>

          {children}

          <Alert>{error}</Alert>

          <div className="flex justify-end gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-md bg-neutral-100 text-sm hover:bg-neutral-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-700 text-white text-sm hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
