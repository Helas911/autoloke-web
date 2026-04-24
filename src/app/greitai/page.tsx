"use client";

import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    window.location.replace(host.endsWith(".dk") ? "/saelg" : "/parduoti");
  }, []);

  return null;
}
