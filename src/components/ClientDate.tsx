"use client";

import { useEffect, useState } from "react";

export function ClientDate({ date, format = "full" }: { date: string; format?: "full" | "time" }) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    const d = new Date(date);
    if (format === "time") {
      setFormatted(d.toLocaleTimeString());
    } else {
      setFormatted(d.toLocaleString());
    }
  }, [date, format]);

  if (!formatted) return <span className="text-gray-600">--</span>;
  return <span>{formatted}</span>;
}
