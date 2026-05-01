import Image from "next/image";
import Link from "next/link";

const COMPANY = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
];

const SOLUTIONS = [
  { label: "Digital Asset Custody", href: "/digital-asset-custody" },
  { label: "DWP Secured Wallet", href: "/signup/wallet" },
  { label: "Digital LLC Application", href: "/signup/llc" },
  { label: "Apply for Both", href: "/signup/both" },
];

const RESOURCES = [
  {
    label: "FINRA BrokerCheck",
    href: "https://brokercheck.finra.org/",
    external: true,
  },
  { label: "Request Consultation", href: "/digital-asset-custody#inquiry" },
  { label: "Login", href: "/login" },
  { label: "Sign Up", href: "/signup/wallet" },
];

const SOCIALS: { label: string; href: string; icon: React.ReactNode }[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/digital-wealth-partners",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.84v1.64h.05c.54-.97 1.85-2 3.81-2 4.07 0 4.82 2.68 4.82 6.16V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.41-2.08 2.86V21h-4V9Z" />
      </svg>
    ),
  },
  {
    label: "X / Twitter",
    href: "https://twitter.com/DWP_advisors",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2H21.5l-7.49 8.56L22.75 22H16l-5.27-6.88L4.7 22H1.44l8.02-9.16L1.25 2h6.92l4.76 6.3L18.24 2Zm-1.16 18h1.85L7.04 4H5.07l12.02 16Z" />
      </svg>
    ),
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="Digital Wealth Partners"
            >
              <Image
                src="/dwp-logo.jpeg"
                alt="Digital Wealth Partners"
                width={739}
                height={415}
                className="h-10 w-auto rounded-md"
              />
              <span className="font-display text-base font-semibold tracking-tight text-white">
                Digital Wealth <span className="text-gold">Partners</span>
              </span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
              Digital Wealth Partners: Your Gateway to Digital Investments.
              Experience tailored strategies for Family Offices, HNWIs, and
              RIAs.
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
              We provide unparalleled expertise in digital assets and
              alternative investments, delivering customized, high-performance
              solutions for our clients.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-zinc-400 transition hover:border-gold hover:text-gold"
                >
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-7 md:pl-4">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Company
                </p>
                <ul className="mt-4 space-y-2.5">
                  {COMPANY.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-zinc-400 transition hover:text-gold"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Solutions
                </p>
                <ul className="mt-4 space-y-2.5">
                  {SOLUTIONS.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-zinc-400 transition hover:text-gold"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Resources
                </p>
                <ul className="mt-4 space-y-2.5">
                  {RESOURCES.map((l) => (
                    <li key={l.href}>
                      {l.external ? (
                        <Link
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-zinc-400 transition hover:text-gold"
                        >
                          {l.label} ↗
                        </Link>
                      ) : (
                        <Link
                          href={l.href}
                          className="text-sm text-zinc-400 transition hover:text-gold"
                        >
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-6">
          <p className="text-xs leading-relaxed text-zinc-500">
            Our clients have built wealth through innovation, hard work, and
            wise decision-making. They came to us to take the next steps
            towards safeguarding and growing that wealth. Digital Wealth
            Partners is here to support you.
          </p>
          <div className="mt-5 flex flex-col items-start justify-between gap-3 text-xs text-zinc-500 sm:flex-row sm:items-center">
            <p>© {year} Digital Wealth Partners. All Rights Reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/" className="transition hover:text-gold">
                Privacy
              </Link>
              <Link href="/" className="transition hover:text-gold">
                Terms
              </Link>
              <Link href="/" className="transition hover:text-gold">
                Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
