// small "Drive" / "File" tag + the link a resource opens
export default function ResourceBadge({ provider }) {
  const drive = provider === "DRIVE";
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
        drive ? "bg-blue-50 text-blue-700" : "bg-neutral-100 text-neutral-700"
      }`}
    >
      {drive ? "Drive" : "File"}
    </span>
  );
}

// Drive links open Google, uploaded files open through our login-checked route
export function resourceHref(r) {
  return r.provider === "LOCAL" ? `/api/resources/${r.id}/file` : r.url;
}