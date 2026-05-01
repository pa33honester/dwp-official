import Link from "next/link";
import { GetStartedDropdown } from "./GetStartedDropdown";

export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col justify-center">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Unlock the
            <br />
            Future of
            <br />
            Wealth with
            <br />
            <span className="text-white">Digital Assets</span>
          </h1>
          <p className="mt-6 max-w-md text-base text-zinc-400">
            Digital Wealth Partners: Your Gateway to Digital Investments.
            Experience Tailored Strategies for Family Offices, HNWIs, and RIAs.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <GetStartedDropdown />
            <Link href="/#services" className="btn-outline">
              View Services
            </Link>
          </div>
          <button
            aria-label="Scroll down"
            className="mt-10 hidden h-9 w-9 items-center justify-center rounded-full border border-border text-zinc-400 transition hover:border-gold hover:text-gold sm:mt-12 sm:inline-flex"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a.75.75 0 0 1 .75.75v10.69l3.72-3.72a.75.75 0 1 1 1.06 1.06l-5 5a.75.75 0 0 1-1.06 0l-5-5a.75.75 0 1 1 1.06-1.06l3.72 3.72V3.75A.75.75 0 0 1 10 3Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="relative">
          <div className="relative h-full min-h-[260px] overflow-hidden rounded-2xl border border-border bg-elevated sm:min-h-[340px] md:min-h-[420px]">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800/50 to-canvas" />
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="flex items-center gap-2 text-center text-xl font-semibold tracking-tight text-white/90 sm:gap-3 sm:text-2xl md:text-3xl">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold-gradient text-canvas sm:h-12 sm:w-12">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M4 4h8a8 8 0 1 1 0 16H4V4Z"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>
                  Digital Wealth <span className="text-gold">Partners</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
