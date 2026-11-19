import Link from "next/link";
import BackLink from "@/components/common/BackLink";
import Alert from "@/components/common/Alert";

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
      <div className="flex justify-center pt-6 pb-10 px-4 sm:pt-12 sm:px-6">
        <form
          onSubmit={onSubmit}
          noValidate
          className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-5 sm:p-8"
        >
          <h2 className="font-semibold text-lg mb-6">{heading}</h2>

          {children}

          <Alert>{error}</Alert>

          {/* phone: stacked, full width, Save on top. sm and up: side by side on the right */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/"
              className="px-4 py-2.5 sm:py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-sm text-center hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 sm:py-2 rounded-md bg-blue-700 dark:bg-blue-600 text-white text-sm hover:bg-blue-800 dark:hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}