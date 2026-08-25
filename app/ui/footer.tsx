"use client";
import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="fixed bottom-0 left-0 w-full border-t bg-background">
      <div className="max-w-5xl mx-auto w-full py-3 text-sm text-muted-foreground px-6 md:px-12 flex items-center justify-between">
        <div className="">© {year} IWE Dashboard</div>
        <div id="survey-footer-actions" className="flex items-center gap-3" />
      </div>
    </footer>
  );
}
