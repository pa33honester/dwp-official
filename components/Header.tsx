import Link from "next/link";
import { Logo } from "./Logo";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Digital Asset Custody", href: "/#custody" },
  { label: "About Us", href: "/#about" },
  { label: "Blog", href: "/#blog" },
  { label: "Login", href: "/login" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-300 transition hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/signup/wallet" className="btn-gold">
          Sign Up
        </Link>
      </div>
    </header>
  );
}
