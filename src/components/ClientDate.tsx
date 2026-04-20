"use client";

import { useEffect, useState } from "react";

export function ClientDate({ date, format = "full" }: { date?: string; format?: "full" | "time" | "date" }) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    const d = date ? new Date(date) : new Date();
    if (format === "time") {
      setFormatted(d.toLocaleTimeString());
    } else if (format === "date") {
      setFormatted(d.toLocaleDateString());
    } else {
      setFormatted(d.toLocaleString());
    }
  }, [date, format]);

  if (!formatted) return <span className="text-gray-600">--</span>;
  return <span>{formatted}</span>;
}
