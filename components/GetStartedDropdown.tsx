"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const OPTIONS = [
  {
    href: "/signup/wallet",
    title: "Apply for DWP Secured Wallet",
    description: "Open a custody wallet for digital assets.",
  },
  {
    href: "/signup/llc",
    title: "Apply for Digital LLC Application",
    description: "Form a digital-asset LLC for entity-level holdings.",
  },
  {
    href: "/signup/both",
    title: "Apply for Both",
    description: "Wallet + LLC together. Recommended for HNW & family offices.",
  },
];

export function GetStartedDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="btn-gold text-base"
      >
        Get Started
        <svg
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-xl border border-border bg-elevated shadow-2xl"
          >
            <ul className="py-1">
              {OPTIONS.map((opt) => (
                <li key={opt.href}>
                  <Link
                    href={opt.href}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-0.5 px-4 py-3 transition hover:bg-surface"
                  >
                    <span className="text-sm font-medium text-white">
                      {opt.title}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {opt.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
