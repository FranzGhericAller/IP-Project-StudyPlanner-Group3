import{ resources } from "@/lib/data";

export default function ResourceCenter(){
  return(
    <div className="min-h-screen bg-[#F6F7F9]">
      <div className="flex items-center justify-between bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <a href="/" className="text-sm rounded-md bg-neutral-100 px-3 py-1.5 hover:bg-neutral-200 text-inksoft">
            ← Back to Dashboard
          </a>
          <h1 className="font-semibold text-lg">Resource Center</h1>
        </div>
        <button className="rounded-md bg-blue-700 text-white px-4 py-2 text-sm hover:bg-blue-800">
          + Add Resource
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6">
        {Object.entries(resources).map(([name, group]) => (
          <div key={name} className="bg-white rounded-[15px] border p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className={`h-6 w-6 rounded-md ${group.color}`}/>
              <h2 className="font-semibold">{name}</h2>
            </div>
            <ul className="space-y-2">
              {group.items.map((item) =>(
                <li key={item} className="flex items-center gap-2 bg-neutral-50 rounded-md px-3 py-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}