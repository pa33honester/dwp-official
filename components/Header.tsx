"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Logo } from "./Logo";

const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Digital Asset Custody", href: "/digital-asset-custody" },
  { label: "About Us", href: "/about-us" },
  { label: "Blog", href: "/blog" },
];

export function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(Boolean(data.session));
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session));
      setEmail(session?.user.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
  }

  const navItems = authed
    ? [...PUBLIC_NAV, { label: "Dashboard", href: "/dashboard" }]
    : [...PUBLIC_NAV, { label: "Login", href: "/login" }];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-300 transition hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {authed === null ? null : authed ? (
            <>
              {email && (
                <span
                  title={email}
                  className="hidden max-w-[160px] truncate text-xs text-zinc-400 md:inline-block"
                >
                  {email}
                </span>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-outline hidden sm:inline-flex"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/signup/wallet" className="btn-gold hidden sm:inline-flex">
              Sign Up
            </Link>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-zinc-300 transition hover:border-gold hover:text-gold lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-canvas/95 backdrop-blur lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-sm text-zinc-300 transition hover:bg-surface hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
            {authed ? (
              <>
                {email && (
                  <span className="mt-2 truncate px-2 text-xs text-zinc-500">
                    {email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn-outline mt-3"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/signup/wallet"
                onClick={() => setOpen(false)}
                className="btn-gold mt-3 sm:hidden"
              >
                Sign Up
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
