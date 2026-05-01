import Link from "next/link";

const CUSTODY_HIGHLIGHTS = [
  "Strong Security Framework",
  "Protected Holdings",
  "Regulation-Aligned Practice",
  "Straightforward Management",
];

export function CustodyTeaser() {
  return (
    <section id="custody" className="border-t border-border/60 bg-elevated/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Digital Asset Custody
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
              Institutional-grade custody for your digital assets
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Secure storage of cryptographic keys, regulation-aligned
              practices, and reliable accessibility — so you can concentrate
              on investment decisions while we handle asset security.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/digital-asset-custody" className="btn-gold">
                Learn More
              </Link>
              <Link
                href="/digital-asset-custody#inquiry"
                className="btn-outline"
              >
                Request Consultation
              </Link>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CUSTODY_HIGHLIGHTS.map((title) => (
              <li
                key={title}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-4"
              >
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-sm font-medium text-white">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
