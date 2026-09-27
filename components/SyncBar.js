export default function SyncBar(){
  return(
    <div className="flex items-center justify-between bg-blue-50 border-t border-blue-100 px-6 py-3 text-sm">
      <div className="flex items-center gap-2 text-ink font-medium">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Synced with Google Calendar
      </div>
      <span className="text-inksoft">Last synced: 2 minutes ago</span>
      <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white text-sm font-medium hover:bg-blue-700">
        Resync Now
      </button>
    </div>
  );
}