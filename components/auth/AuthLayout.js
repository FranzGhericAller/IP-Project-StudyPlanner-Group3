// Shared two-panel layout for /login and /register.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#F6F7F9]">
      {/* Left: brand panel (hidden on small screens) */}
      <aside className="hidden md:flex flex-col justify-between bg-neutral-900 text-white p-10">
        <div className="text-lg font-semibold">Study Planner</div>

        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Plan your study week,
            <br />
            all in one place.
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-400" />
              Sync your classes and meetings from Google Calendar.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-rose-400" />
              Track tasks by priority and never miss a deadline.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-400" />
              Keep notes, Drive files, and Notion pages in one Resource Center.
            </li>
          </ul>
        </div>

        <p className="text-xs text-neutral-500">Integrative Programming Project</p>
      </aside>

      {/* Right: form */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-6 text-center text-lg font-semibold">
            Study Planner
          </div>

          <div className="bg-white rounded-lg border p-8">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="mt-1 mb-6 text-sm text-inksoft">{subtitle}</p>
            {children}
          </div>

          <p className="mt-4 text-center text-sm text-inksoft">{footer}</p>
        </div>
      </main>
    </div>
  );
}