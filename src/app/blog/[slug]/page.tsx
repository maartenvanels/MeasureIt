import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getPostBySlug, posts } from '@/content/blog/posts';
import { Calendar, Clock, ArrowLeft, Github, Coffee } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — MeasureIt Blog`,
    description: post.excerpt,
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-sm font-bold text-white">
                M
              </div>
              <span className="text-lg font-semibold">MeasureIt</span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/app">
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
                Open App
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All posts
        </Link>

        {/* Post header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min read
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        <hr className="border-border/50 mb-10" />

        {/* Post content */}
        <div className="prose-blog">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mt-8 mb-3 text-foreground">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-5 text-muted-foreground leading-relaxed">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-muted-foreground">{children}</em>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-rose-500 pl-4 my-6 text-muted-foreground italic">
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="border-border/50 my-8" />,
              ul: ({ children }) => (
                <ul className="mb-5 space-y-1.5 text-muted-foreground">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="flex gap-2 leading-relaxed">
                  <span className="text-rose-500 mt-1.5 shrink-0 text-xs">▸</span>
                  <span>{children}</span>
                </li>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:text-rose-400 underline underline-offset-2 transition-colors"
                >
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">
                  {children}
                </code>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* CTA footer */}
        <div className="mt-14 rounded-xl border border-border/50 bg-card/50 p-6">
          <h3 className="font-semibold mb-2">Enjoyed this post?</h3>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            MeasureIt is free and open source. If it saves you time or sparks an idea, consider supporting the project.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/sponsors"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background px-4 py-2 text-sm font-medium hover:border-rose-500/40 hover:text-rose-500 transition-all"
            >
              <Github className="h-4 w-4" />
              GitHub Sponsors
            </a>
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background px-4 py-2 text-sm font-medium hover:border-rose-500/40 hover:text-rose-500 transition-all"
            >
              <Coffee className="h-4 w-4" />
              Buy me a coffee
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background px-4 py-2 text-sm font-medium hover:border-rose-500/40 hover:text-rose-500 transition-all"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
