"use client";

import { useState } from "react";
import { inputClass } from "@/lib/ui";

// pw input w/ a Show/Hide toggle
export default function PasswordInput({ id, value, onChange, placeholder, autoComplete, error }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${inputClass} pr-16 ${error ? "border-rose-400" : ""}`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-inksoft hover:text-ink"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
