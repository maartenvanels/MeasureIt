export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readingTime: number; // minutes
  content: string;
}

export const posts: BlogPost[] = [
  {
    slug: 'why-i-built-measureit',
    title: 'Why I Built MeasureIt — and Why It Has to Stay Open',
    date: '2026-02-19',
    excerpt:
      'Building a tool in your free time, keeping it free forever, and hoping people join for the ride. This is what MeasureIt is really about.',
    readingTime: 5,
    content: `
## It Started With 3D Printing

I'm into 3D printing. At some point I had a photo of a part I wanted to replicate — I could see a known reference object in the frame, but I needed the actual dimensions of everything else in the shot.

Every tool I found was either behind a paywall, buried in bloated software, or required an install. So I built my own. That's how MeasureIt started: a side project born from a 3D printing problem, turned into something I genuinely enjoy working on.

The 3D side of the project is still very much alive — you can load a 3D model directly and measure it in the same way you'd measure a photo. Same workflow, same reference scaling, just a different kind of object.

---

## The Real Goal: Experimenting with UI

Honestly? The measurement tool is almost secondary.

What excites me is building interfaces that feel *good to use*. The kind of UI where things happen exactly when you expect them to. Where the tool gets out of your way and you can focus on the actual work.

MeasureIt is my playground for that. Every interaction — the way measurements snap to points, the way labels follow your lines, the way you can drag a canvas like you're holding it — all of that is intentional and interesting to me.

**Simple but not dumbed-down. Precise but not complicated.** That's the target.

---

## Why Open Source?

Because I believe the best tools are the ones people can actually look at, learn from, and contribute to.

I have no grand monetization strategy here. There's no paid tier coming. The code is open, the tool is free, and that's the point. If you're learning to build web apps — React, canvas rendering, coordinate systems, state management — you're welcome to dig through this codebase and take whatever's useful.

> *I learn by building. Maybe you do too.*

---

## Costs Are Low, On Purpose

Right now MeasureIt is hosted on Vercel's free tier. There's no database. No backend. Everything runs in your browser. The only recurring cost I have is the domain name.

I want to keep it that way. The moment a tool becomes expensive to run, the temptation to monetize it creeps in — and I don't want that pressure affecting decisions about what to build.

If costs grow, I'll cover them myself as long as I can. After that, I hope the community helps.

---

## Sponsorship

If MeasureIt has saved you time or made something easier, and you want to say thanks — that means a lot.

- **[GitHub Sponsors](https://github.com/sponsors)** — even a small monthly amount helps keep the lights on
- **Buy me a coffee** — one-time, no commitment, just appreciation

Neither of these is required. The tool will always be free. But if you use it regularly and get value from it, knowing that honestly keeps me motivated to keep building.

---

## The Kind of Project I Want This to Be

I want MeasureIt to be the kind of open source project where:

- Someone files an issue and gets a real response
- A pull request that improves something gets merged
- Feedback actually changes what gets built next
- The codebase stays readable enough that newcomers can contribute

I'm building this in my free time. That means I can build exactly what I find interesting, without needing to justify it to anyone. It also means progress sometimes happens in bursts — a big weekend of work, then silence for a few weeks. That's fine.

---

## Let's Build Cool Things Together

If you're the kind of person who:

- Gets excited about clean UIs
- Wants to understand how canvas rendering works
- Has an idea for a measurement feature that would help you
- Wants to learn by working on a real project

Then open an issue, start a discussion, or send a pull request. I'm genuinely interested in what you'd want to see in a tool like this.

The best version of MeasureIt isn't something I build alone. It's something we build together.

---

*— Built with curiosity, maintained with care. Feedback is always welcome.*
    `.trim(),
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
