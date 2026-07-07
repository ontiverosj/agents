import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { blogPosts, getBlogPost } from "@/lib/data";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <Link href="/blog" className="text-sm font-medium text-violet-600 hover:text-violet-800">
        ← All posts
      </Link>
      <p className="mt-8 text-sm text-ink-400">
        {post.category} · {post.date} · {post.readMinutes} min read
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink-950 sm:text-4xl">
        {post.title}
      </h1>
      <div className="mt-10 space-y-6">
        {post.body.map((para, i) => (
          <p key={i} className="text-[17px] leading-[1.8] text-ink-700">{para}</p>
        ))}
      </div>
      <div className="mt-14 rounded-2xl bg-ink-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-ink-950">Put an AI coworker on your team</h2>
        <p className="mt-2 text-sm text-ink-500">Free plan, real task runs, set up in minutes.</p>
        <div className="mt-5">
          <ButtonLink href="/signup">Start Free</ButtonLink>
        </div>
      </div>
    </article>
  );
}
