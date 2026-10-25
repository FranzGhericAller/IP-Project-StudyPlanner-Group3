"use client";

import { useState } from "react";

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}) {
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
        className={`w-full border rounded-[10px] px-3 py-2 pr-16 text-sm placeholder:text-inksoft ${
          error ? "border-rose-400" : ""
        }`}
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