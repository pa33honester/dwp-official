import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Digital Wealth Partners",
  description:
    "News, announcements, and insights from Digital Wealth Partners on digital assets, custody, and alternative investments.",
};

export default function BlogPage() {
  const [featured, ...rest] = POSTS;

  return (
    <main>
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Blog
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Insights from Digital Wealth Partners
            </h1>
            <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">
              Learn about the complex world of digital assets from credentialed
              experts. News, announcements, and educational guides.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <article className="grid grid-cols-1 gap-6 overflow-hidden rounded-2xl border border-border bg-surface/40 md:grid-cols-2 md:gap-0">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-elevated md:aspect-auto md:min-h-[320px]">
              {featured.image ? (
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800/60 to-canvas" />
              )}
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider">
                <span className="rounded-full bg-gold/15 px-2.5 py-1 font-semibold text-gold">
                  {featured.category}
                </span>
                <span className="text-zinc-500">{featured.date}</span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                {featured.excerpt}
              </p>
              <div className="mt-6">
                <Link
                  href={`/blog/${featured.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:underline"
                >
                  Read article
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 0 1 .75-.75h10.69l-3.72-3.72a.75.75 0 1 1 1.06-1.06l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06l3.72-3.72H3.75A.75.75 0 0 1 3 10Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="border-t border-border/60 bg-elevated/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            More from the team
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 transition hover:border-gold/60"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-elevated">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800/60 to-canvas" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider">
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">
                      {post.category}
                    </span>
                    <span className="text-zinc-500">{post.date}</span>
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold leading-snug text-white sm:text-lg">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gold opacity-0 transition group-hover:opacity-100">
                    Read article →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
