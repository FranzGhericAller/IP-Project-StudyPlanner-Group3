"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";
import { priorityStyles } from "@/lib/data";

export default function AddTask(){
  const router = useRouter();
  const [priority, setPriority] = useState("High");
  return(
    <div className="min-h-screen bg-[#F6F7F9]">
      <BackLink title="Add New Task" />
      <div className="flex justify-center pt-12 px-6">
        <div className="w-full max-w-md bg-white rounded-lg border p-8">
          <h2 className="font-semibold text-lg mb-6">Create a Task</h2>
          <label className="block text-sm font-medium mb-1">Task Name</label>
          <input
            className="w-full border rounded-[10px] px-3 py-2 text-sm mb-4 placeholder:text-inksoft"
            placeholder="e.g. Exam Preparation"
          />
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
           className="w-full border rounded-[10px] px-3 py-2 text-sm mb-4 placeholder:text-inksoft"
            placeholder="e.g. Programming, Web Development, etc."
          />
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            className="w-full border rounded-[10px] px-3 py-2 text-sm mb-4 placeholder:text-inksoft"
            placeholder="Select a date & time"
          />
          <label className="block text-sm font-medium mb-2">Priority</label>
          <div className="flex gap-2 mb-4">
            {Object.keys(priorityStyles).map((p) =>(
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`text-xs px-3 py-1.5 rounded-full border ${priorityStyles[p].bg} ${priorityStyles[p].text}${
                  priority === p ? priorityStyles[p].border + " ring-2 ring-offset-1" : "border-transparent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input
            className="w-full border rounded-[10px] px-3 py-2 text-sm mb-4 placeholder:text-inksoft"
            placeholder="Optional notes about this task..."
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-md bg-neutral-100 text-sm hover:bg-neutral-200"
            >
              Cancel
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-md bg-blue-700 text-white text-sm hover:bg-blue-800"
            >
              Save Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}