import Link from "next/link";
export default function BackLink({ title }){
  return(
    <div className="flex items-center gap-4 bg-white border-b px-6 py-4">
      <Link
        href="/"
        className="text-sm rounded-md bg-neutral-100 px-3 py-1.5 hover:bg-neutral-200 text-inksoft"
      >
        ← Back to Dashboard
      </Link>
      <h1 className="font-semibold text-lg">{title}</h1>
    </div>
  );
}