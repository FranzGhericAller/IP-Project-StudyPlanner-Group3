import Link from "next/link";

export default function BackLink({ title, children }) {
  return (
    <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
      <Link
        href="/"
        className="text-sm rounded-md bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-inksoft"
      >
        ← Back to Dashboard
      </Link>
      <h1 className="font-semibold text-lg">{title}</h1>
      {children && <div className="ml-auto">{children}</div>}
    </div>
  );
}