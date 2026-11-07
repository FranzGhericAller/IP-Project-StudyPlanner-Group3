import BackLink from "@/components/common/BackLink";

// TODO: connect Drive / Notion / uploads. these are just sample items for now
// (the "resources" table in the db is already set up for this)
const sampleResources = [
  {
    name: "Google Drive",
    color: "bg-blue-100",
    items: ["Web Dev - Lecture Notes.pdf", "Capstone Documentation.docx", "Mobile App UI Mockups (folder)"],
  },
  {
    name: "Notion",
    color: "bg-neutral-200",
    items: ["Sprint Backlog", "Bug Tracker", "API Documentation (REST Services)"],
  },
  {
    name: "Local Files",
    color: "bg-orange-100",
    items: ["project_prototype.zip", "database_schema.png", "thesis_draft_v2.docx"],
  },
];

export default function ResourceCenter() {
  return (
    <div className="min-h-screen">
      <BackLink title="Resource Center">
        <button className="rounded-md bg-blue-700 text-white px-4 py-2 text-sm hover:bg-blue-800">
          + Add Resource
        </button>
      </BackLink>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6">
        {sampleResources.map((group) => (
          <div key={group.name} className="bg-white rounded-[15px] border p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className={`h-6 w-6 rounded-md ${group.color}`} />
              <h2 className="font-semibold">{group.name}</h2>
            </div>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 bg-neutral-50 rounded-md px-3 py-2 text-sm"
                >
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
