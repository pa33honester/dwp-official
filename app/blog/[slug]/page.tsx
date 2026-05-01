import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POSTS } from "@/lib/blog";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} — Digital Wealth Partners`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const idx = POSTS.findIndex((p) => p.slug === slug);
  const related = POSTS.filter((_, i) => i !== idx).slice(0, 3);

  const paragraphs = post.body && post.body.length > 0 ? post.body : [post.excerpt];

  return (
    <main>
      <article className="relative">
        <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 sm:pt-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-gold"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.56l3.72 3.72a.75.75 0 1 1-1.06 1.06l-5-5a.75.75 0 0 1 0-1.06l5-5a.75.75 0 1 1 1.06 1.06L5.56 9.25h10.69A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
            Back to all posts
          </Link>

          <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-wider">
            <span className="rounded-full bg-gold/15 px-2.5 py-1 font-semibold text-gold">
              {post.category}
            </span>
            <span className="text-zinc-500">{post.date}</span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
        </div>

        {post.image && (
          <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-elevated">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        <div className="mx-auto mt-10 max-w-3xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="space-y-5 text-base leading-relaxed text-zinc-300">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-border/60 pt-8">
            <Link href="/digital-asset-custody#inquiry" className="btn-gold">
              Request Consultation
            </Link>
            <Link href="/signup/wallet" className="btn-outline">
              Get Started
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border/60 bg-elevated/30">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
            <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
              More from the team
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 transition hover:border-gold/60"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-elevated">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800/60 to-canvas" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider">
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">
                        {p.category}
                      </span>
                      <span className="text-zinc-500">{p.date}</span>
                    </div>
                    <h3 className="mt-3 font-display text-base font-semibold leading-snug text-white sm:text-lg">
                      {p.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
