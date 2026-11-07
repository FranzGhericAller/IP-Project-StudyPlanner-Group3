// red box for errors, blue for info. renders nothing if there's no msg
export default function Alert({ type = "error", children }) {
  if (!children) return null;

  const colors =
    type === "error"
      ? "bg-rose-50 border-rose-200 text-rose-700"
      : "bg-blue-50 border-blue-100 text-blue-700";

  return <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${colors}`}>{children}</div>;
}
