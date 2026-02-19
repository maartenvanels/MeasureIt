import Link from 'next/link';
import { Ruler, Upload, MousePointer2, Download, Keyboard, Smartphone, TriangleRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { BlueprintGrid } from '@/components/landing/BlueprintGrid';
import { DrawingLine } from '@/components/landing/DrawingLine';
import HeroScene from '@/components/landing/HeroScene';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TypewriterPhrase } from '@/components/landing/TypewriterPhrase';

const steps = [
  {
    step: '1',
    title: 'Load an image',
    desc: 'Drag & drop, paste from clipboard, or click to upload. Any image format works.',
  },
  {
    step: '2',
    title: 'Set a reference',
    desc: 'Draw a line over a known dimension and enter its real-world measurement.',
  },
  {
    step: '3',
    title: 'Measure everything',
    desc: 'Draw lines anywhere on the image. Real dimensions are calculated automatically.',
  },
];

const features = [
  { icon: Upload, title: 'Drag & Drop', desc: 'Load images instantly. Supports paste from clipboard.' },
  { icon: Ruler, title: 'Reference Scaling', desc: 'Set one known measurement, calculate everything else.' },
  { icon: TriangleRight, title: 'Angle Measurement', desc: 'Measure angles between any two lines.' },
  { icon: MousePointer2, title: 'Zoom & Pan', desc: 'Scroll to zoom, middle-click to pan. Pixel-perfect precision.' },
  { icon: Keyboard, title: 'Keyboard Shortcuts', desc: 'R for reference, M for measure, Ctrl+Z to undo.' },
  { icon: Download, title: 'Export Anywhere', desc: 'CSV, JSON, clipboard, or annotated image export.' },
  { icon: Smartphone, title: 'Touch Support', desc: 'Pinch to zoom, tap to measure. Works on mobile.' },
  { icon: Save, title: 'Save Projects', desc: 'Save your work locally. Pick up where you left off.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-sm font-bold text-white">
              M
            </div>
            <span className="text-lg font-semibold">MeasureIt</span>
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

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 text-center overflow-hidden">
        {/* 3D scene behind text */}
        <HeroScene />
        {/* Blueprint grid pattern */}
        <BlueprintGrid />
        {/* Rose glow */}
        <div className="absolute left-1/2 top-1/3 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600/10 blur-[120px] animate-glow-pulse" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Free &amp; open source
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Measure anything
            <br />
            <TypewriterPhrase />
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Know one dimension? MeasureIt calculates the rest.
            Set a reference measurement on any image, then draw lines to get
            real-world dimensions instantly.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/app">
              <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white px-8 text-base">
                <Ruler className="mr-2 h-5 w-5" />
                Start Measuring
              </Button>
            </Link>
            <a href="https://github.com/maartenvanels/MeasureIt" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="px-8 text-base">
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Drawing line divider */}
      <DrawingLine />

      {/* How it works */}
      <section className="border-t border-border/50 bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <AnimatedSection>
            <h2 className="text-center text-3xl font-bold">How it works</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              Three simple steps to measure anything in a photo
            </p>
          </AnimatedSection>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 150}>
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600/10 text-2xl font-bold text-rose-500">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <AnimatedSection>
            <h2 className="text-center text-3xl font-bold">Features</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              A precision tool built for engineers, makers, and designers
            </p>
          </AnimatedSection>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, i) => (
              <AnimatedSection key={feat.title} delay={i * 80}>
                <div className="rounded-xl border border-border bg-card/50 p-5 transition-all duration-300 hover:border-rose-500/30 hover:bg-card/80 hover:shadow-[0_0_30px_-5px_rgba(225,29,72,0.15)] hover:-translate-y-1">
                  <feat.icon className="h-8 w-8 text-rose-500" />
                  <h3 className="mt-3 font-semibold">{feat.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-card/30 py-24 text-center">
        <AnimatedSection className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Ready to measure?</h2>
          <p className="mt-4 text-muted-foreground">
            No sign-up required. No data leaves your browser. Just open and start measuring.
          </p>
          <Link href="/app" className="mt-8 inline-block">
            <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white px-10 text-base">
              Open MeasureIt
            </Button>
          </Link>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} MeasureIt</span>
          <a
            href="https://github.com/maartenvanels/MeasureIt"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
