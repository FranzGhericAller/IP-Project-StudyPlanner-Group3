// small "G" = this task/event is linked to Google. same badge everywhere
export default function GoogleBadge({ title = "Synced with Google" }) {
  return (
    <span
      title={title}
      className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium leading-none text-blue-700"
    >
      G
    </span>
  );
}