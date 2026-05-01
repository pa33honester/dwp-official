import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { TEAM } from "@/lib/team";

export const metadata: Metadata = {
  title: "About Us — Digital Wealth Partners",
  description:
    "Meet the team behind Digital Wealth Partners — a Registered Investment Advisor specializing in digital assets and alternative investments for Family Offices, HNWIs, and RIAs.",
};

export default function AboutUsPage() {
  return (
    <main>
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              About Us
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Redefining Wealth Management for the Digital Age
            </h1>
            <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">
              Digital Wealth Partners (DWP) is a Registered Investment Advisor
              (RIA) specializing in digital assets and alternative investments,
              catering to Family Offices, High Net Worth Individuals (HNWI),
              and other RIAs.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-elevated/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                Our Mission
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                To redefine wealth management for the digital age by providing
                unparalleled expertise in digital assets and alternative
                investments, delivering customized, high-performance investment
                solutions to our clients.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Our clients have built wealth through innovation, hard work,
                and wise decision-making. They came to us to take the next
                steps towards safeguarding and growing that wealth. Digital
                Wealth Partners is here to support you.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                Our Approach
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Leveraging a hedge fund type model and fee structure, DWP
                offers a unique blend of expertise in the burgeoning field of
                digital assets — including cryptocurrencies, blockchain-based
                assets, and other non-traditional investment opportunities.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Our partners are deeply rooted in cryptocurrency trends and
                innovative investment strategies. We're committed to robust
                security measures, regulatory compliance, and transparent
                communication.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Leadership
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Meet Our Team
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Experienced leaders rooted in traditional finance and digital
              asset innovation.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((m) => (
              <article
                key={m.slug}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 transition hover:border-gold/60"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-elevated">
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="font-display text-lg font-semibold text-white">
                    {m.name}
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    {m.title}
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
                    {m.description.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {(m.linkedin || m.twitter) && (
                    <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                      {m.linkedin && (
                        <Link
                          href={m.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${m.name} on LinkedIn`}
                          className="text-zinc-400 transition hover:text-gold"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.84v1.64h.05c.54-.97 1.85-2 3.81-2 4.07 0 4.82 2.68 4.82 6.16V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.41-2.08 2.86V21h-4V9Z" />
                          </svg>
                        </Link>
                      )}
                      {m.twitter && (
                        <Link
                          href={m.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${m.name} on X`}
                          className="text-zinc-400 transition hover:text-gold"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.244 2H21.5l-7.49 8.56L22.75 22H16l-5.27-6.88L4.7 22H1.44l8.02-9.16L1.25 2h6.92l4.76 6.3L18.24 2Zm-1.16 18h1.85L7.04 4H5.07l12.02 16Z" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-elevated/30">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Work with Digital Wealth Partners
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            We provide unparalleled expertise in digital assets and alternative
            investments, delivering customized, high-performance solutions for
            our clients.
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
