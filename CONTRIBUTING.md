# Contributing to MeasureIt

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/maartenvanels/MeasureIt.git
cd MeasureIt

# Install dependencies (requires Bun 1.3.5+)
bun install

# Start dev server
bun run dev

# Run tests
bun run test

# Type check + build
bun run build
```

## Code Style

- **TypeScript** with strict mode — no `any` unless absolutely necessary
- **Tailwind CSS 4** for styling — avoid inline styles
- **Zustand 5** for state — immutable updates, no direct mutation
- **`@/` path alias** maps to `src/`
- Store naming: `use{Name}Store`, hooks: `use{Feature}`

## Architecture

See [CLAUDE.md](CLAUDE.md) for a detailed architecture overview. Key points:

- **Two coordinate spaces**: image space (stored) and screen space (rendered)
- **Three Zustand stores**: measurements, UI, canvas
- **Dual-canvas rendering**: image layer + overlay layer with HTML overlays for labels

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `bun run test` and `bun run build` pass
4. Open a PR with a clear description of what changed and why

## Reporting Issues

Open an issue on GitHub with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser and OS info

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
