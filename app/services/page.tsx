import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services — Digital Wealth Partners",
  description:
    "Comprehensive digital asset services: secure management, exclusive opportunities, tailored strategies, and expert advisory for the modern investor.",
};

const PILLARS = [
  {
    eyebrow: "Strategic Digital Asset Management",
    title:
      "Elevating Portfolio Performance through Strategic Digital Asset Management",
    body: "Our team of experts specializes in the active management of cryptocurrency and blockchain asset portfolios, employing a comprehensive risk management framework. Leveraging cutting-edge technology and deep market insights, we aim to optimize returns while meticulously controlling for volatility and security risks, ensuring your investments are both profitable and protected.",
  },
  {
    eyebrow: "Curated Investment Opportunities",
    title: "Unlocking the Potential of Exclusive Investments",
    body: "Gain unparalleled access to a carefully selected range of exclusive, vetted opportunities within the digital and alternative investment space. Our network opens doors to innovative and emerging markets, offering you the chance to diversify your portfolio with investments curated for their unique potential and managed with our hallmark precision and insight.",
  },
  {
    eyebrow: "Tailored Investment Strategies",
    title: "Tailoring Success with Personalized Investment Strategies",
    body: "Understanding that each investor’s goals and risk tolerance are unique, we offer bespoke investment solutions. Our approach begins with a deep dive into your financial aspirations, followed by the crafting of tailored strategies that not only align with your personal risk profile but also aim to exceed your investment objectives, ensuring a truly personalized pathway to financial growth.",
  },
  {
    eyebrow: "Expert Advisory & Education",
    title: "Empowering Investors through Expert Advisory and Education",
    body: "Our commitment to client empowerment extends beyond portfolio management to include comprehensive education and advisory services. Stay ahead of the curve with our in-depth analyses of market trends, risk assessment techniques, and strategic investment planning. Our experts are dedicated to providing you with the knowledge and tools needed to make informed decisions, fostering a collaborative approach to achieving your investment ambitions.",
  },
];

export default function ServicesPage() {
  return (
    <main>
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Services
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Comprehensive Digital Asset Services
            </h1>
            <p className="mt-4 text-base text-zinc-300 sm:text-lg">
              Secure Management, Exclusive Opportunities, Tailored Solutions,
              and Expert Advisory for the Modern Investor.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Digital Wealth Partners (DWP) is a Registered Investment Advisor
              (RIA) specializing in digital assets and alternative investments,
              catering to Family Offices, High Net Worth Individuals (HNWI),
              and other RIAs. DWP offers a unique blend of expertise in the
              burgeoning field of digital assets — including cryptocurrencies,
              blockchain-based assets, and other non-traditional investment
              opportunities — delivering sophisticated, high-return investment
              strategies tailored to each client’s risk tolerance and
              objectives.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-elevated/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {PILLARS.map((p, i) => (
              <article
                key={p.eyebrow}
                className="rounded-2xl border border-border bg-surface/40 p-6 transition hover:border-gold/60 hover:shadow-gold sm:p-8"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold-gradient text-sm font-semibold text-canvas">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    {p.eyebrow}
                  </p>
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold leading-snug text-white sm:text-xl">
                  {p.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Ready to put these services to work?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Apply for a DWP Secured Wallet, form a Digital Asset LLC, or
            request a custody consultation — our team will guide you through
            the right path for your goals.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/signup/wallet" className="btn-gold">
              Get Started
            </Link>
            <Link href="/digital-asset-custody#inquiry" className="btn-outline">
              Request Consultation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
