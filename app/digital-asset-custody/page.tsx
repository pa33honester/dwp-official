import Link from "next/link";
import type { Metadata } from "next";
import { CustodyInquiryForm } from "@/components/forms/CustodyInquiryForm";

export const metadata: Metadata = {
  title: "Digital Asset Custody — Digital Wealth Partners",
  description:
    "Institutional-grade custody for cryptocurrencies and blockchain assets. Secure storage, regulation-aligned practices, and reliable accessibility.",
};

const FEATURES = [
  {
    title: "Strong Security Framework",
    body: "Our technology implements multiple security layers, providing thorough protection while maintaining efficient transaction processing. Your assets receive protection against external threats and internal risks.",
  },
  {
    title: "Protected Holdings",
    body: "Your assets receive protection through both technical measures and insurance coverage.",
  },
  {
    title: "Adaptable Technology",
    body: "As digital assets continue to develop, our systems adapt to support new assets and opportunities.",
  },
  {
    title: "Regulation-Aligned Practice",
    body: "Asset management follows current regulations, helping reduce legal and operational risks.",
  },
  {
    title: "Financial Sector Background",
    body: "Our experience in traditional finance informs our practices in digital asset management.",
  },
  {
    title: "Straightforward Management",
    body: "You can concentrate on investment decisions while we handle asset security. The client portal makes portfolio management clear and direct.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Consultation",
    body: "Share your holdings, objectives, and any existing structure. We confirm fit and outline a tailored custody plan.",
  },
  {
    step: "02",
    title: "Onboarding & verification",
    body: "Complete KYC/AML, entity verification (LLC / trust / corporation if applicable), and sign your custody agreement.",
  },
  {
    step: "03",
    title: "Asset transfer",
    body: "Move your digital assets into institutional custody with guided, monitored transfers — no seed phrases handled by anyone but you.",
  },
  {
    step: "04",
    title: "Ongoing oversight",
    body: "Track holdings through the client portal. Reporting, rebalancing, and approvals are clear and direct.",
  },
];

export default function DigitalAssetCustodyPage() {
  return (
    <main>
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Digital Asset Custody
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Digital Asset Custody with Digital Wealth Partners
            </h1>
            <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">
              Institutional-grade custody for cryptocurrencies and
              blockchain-based assets — secure storage of cryptographic keys,
              reliable accessibility, and regulation-aligned practices.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="#inquiry" className="btn-gold">
                Request Consultation
              </Link>
              <Link href="/signup/wallet" className="btn-outline">
                Apply for DWP Secured Wallet
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-elevated/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                Why custody matters
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Digital Asset Custody plays an important role in the changing
                world of cryptocurrencies and blockchain-based assets. With the
                market value exceeding $1 trillion and financial institutions
                entering the space, secure custody solutions support investor
                confidence and wider adoption. These services provide secure
                storage of cryptographic keys, which establish ownership and
                enable transactions of digital assets.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Digital assets require robust protection and reliable
                accessibility in today’s economy. Our custody solutions
                maintain security while enabling asset accessibility.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                Our approach
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                We combine institutional-grade security with practical
                accessibility. Multiple security layers protect your assets
                against external threats and internal risks, while a
                straightforward client portal keeps oversight clear and
                direct.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Backed by a team rooted in traditional finance, our practices
                follow current regulations to help reduce legal and
                operational risk — so you can concentrate on investment
                decisions while we handle asset security.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              What you get
            </h2>
            <p className="mt-3 text-sm text-zinc-400 sm:text-base">
              Six pillars of our institutional custody offering.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-surface/60 p-5"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-gold/15 text-gold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m9 12 2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="font-medium text-white">{f.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-elevated/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-sm text-zinc-400 sm:text-base">
              From first conversation to ongoing oversight.
            </p>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s) => (
              <li
                key={s.step}
                className="rounded-xl border border-border bg-surface/60 p-5"
              >
                <p className="font-display text-2xl font-semibold text-gold">
                  {s.step}
                </p>
                <p className="mt-2 font-medium text-white">{s.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="inquiry" className="border-t border-border/60 bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Get Started
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Contact Digital Wealth Partners to discuss how our custody
              solutions can support your specific requirements.
            </p>
          </div>
          <CustodyInquiryForm />
        </div>
      </section>
    </main>
  );
}
