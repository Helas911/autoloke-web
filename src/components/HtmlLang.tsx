"use client";

import { useEffect } from "react";
import { getSiteCountry } from "@/lib/site";

export function HtmlLang() {
  useEffect(() => {
    const country = getSiteCountry();
    document.documentElement.lang = country === "DK" ? "da" : "lt";
  }, []);

  return null;
}
