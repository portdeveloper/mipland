"use client";

import Link from "next/link";

export default function GlobalFooter() {
  return (
    <footer className="w-full bg-text-primary text-surface">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 font-mono text-[11px] flex-wrap">
            <span className="text-surface/25 mr-2">Experimental</span>
            <Link
              href="/spam-mev"
              className="inline-flex items-center text-surface/40 hover:text-surface transition-colors px-3 py-2.5 rounded min-h-11"
            >
              Blockspace Under Pressure
            </Link>
            <Link
              href="/infra"
              className="inline-flex items-center text-surface/40 hover:text-surface transition-colors px-3 py-2.5 rounded min-h-11"
            >
              Interactive Infra Playground
            </Link>
            <Link
              href="/btx"
              className="inline-flex items-center text-surface/40 hover:text-surface transition-colors px-3 py-2.5 rounded min-h-11"
            >
              Batched Threshold Encryption
            </Link>
          </div>
          <p className="font-mono text-[11px] text-surface/25">
            <Link
              href="/about"
              className="inline-flex items-center text-surface/40 hover:text-surface transition-colors underline underline-offset-2 px-1 py-2 min-h-11"
            >
              About
            </Link>
            <span className="mx-1">·</span>
            made by{" "}
            <a
              href="https://x.com/port_dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-surface/40 hover:text-surface transition-colors underline underline-offset-2 px-1 py-2 min-h-11"
            >
              port
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
