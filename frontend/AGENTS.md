# Frontend AGENTS.md — PeoplePay360 UI

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (\@tailwindcss/vite\) |
| Component primitives | shadcn/ui (Radix UI based) |
| Type safety | TypeScript 6 |
| Utilities | \cn()\ from \@/lib/utils\ (clsx + tailwind-merge) |

---

## Project Structure

\\\
frontend/
├── src/
│   ├── index.css          # Global styles + Odoo design tokens (@theme)
│   ├── App.css            # App-level overrides
│   ├── App.tsx            # Root component / design system demo
│   ├── main.tsx           # React entry point
│   ├── lib/
│   │   └── utils.ts       # cn() utility
│   └── components/
│       └── ui/            # shadcn/ui components
├── components.json        # shadcn/ui configuration
├── vite.config.ts         # Vite + Tailwind plugin + @ alias
├── tsconfig.app.json      # TypeScript config with @ path alias
└── index.html             # HTML entry
\\\

---

## Odoo Design Token System

All design tokens live in \src/index.css\ inside \@theme {}\ and are CSS custom properties.

### Colors

| Token | Value | Usage |
|---|---|---|
| \--color-primary\ | \#714867\ | Odoo Dirty Purple — buttons, focus rings |
| \--color-primary-hover\ | \#5d3a55\ | Hover state |
| \--color-text-heading\ | \#1A1F36\ | All headings |
| \--color-text-body\ | \#3D4460\ | Body copy |
| \--color-text-muted\ | \#6B7280\ | Secondary text |
| \--color-bg-base\ | \#FFFFFF\ | Page background |
| \--color-bg-surface\ | \#F8F9FA\ | Cards, panels |
| \--color-bg-muted\ | \#F1F3F4\ | Inputs, sidebars |
| \--color-success\ | \#00C853\ | Success state |
| \--color-warning\ | \#FFB300\ | Warning state |
| \--color-danger\ | \#FF1744\ | Error state |
| \--color-border\ | \#E2E5EA\ | Default border |

### Typography

| Token | Value | Usage |
|---|---|---|
| \--font-sans\ | \'Inter'\ | All text |
| \--font-size-table-th\ | \12px\ | Table headers |
| \--font-size-table-td\ | \14px\ | Table cells |
| \--font-size-body\ | \16px\ | Body text |
| \--font-weight-bold\ | \700\ | Headings |
| \--line-height-tight\ | \1.2\ | Headings |

### Border Radii

| Token | Value | Usage |
|---|---|---|
| \--radius-input\ | \4px\ | Inputs, buttons |
| \--radius-card\ | \8px\ | Cards, modals |
| \--radius-badge\ | \9999px\ | Status badges (pill) |

---

## Component Classes (pp-*)

| Class | Description |
|---|---|
| \.pp-btn-primary\ | Odoo-purple filled button |
| \.pp-btn-secondary\ | Outlined purple button |
| \.pp-btn-ghost\ | Neutral ghost button |
| \.pp-input\ | Styled input |
| \.pp-card\ | Surface card with shadow |
| \.pp-card-flat\ | Flat card no shadow |
| \.pp-table\ | Data-dense table |
| \.pp-badge-success\ | Green pill badge |
| \.pp-badge-warning\ | Amber pill badge |
| \.pp-badge-danger\ | Red pill badge |
| \.pp-badge-neutral\ | Grey pill badge |

---

## Adding shadcn/ui Components

\\\ash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
\\\

Components go to \src/components/ui/\. Import via:
\\\	sx
import { Button } from '@/components/ui/button'
\\\

---

## AI Agent Rules

1. Use \--color-primary\ (#714867) for all brand-coloured interactive elements.
2. Use \--color-text-heading\ (#1A1F36) for headings — never hardcode colours.
3. Status badges must use \.pp-badge\ + \.pp-badge-{variant}\.
4. Table headers = 12px (\--font-size-table-th\), cells = 14px (\--font-size-table-td\).
5. Inputs and buttons: 4px radius. Cards: 8px radius.
6. Use \cn()\ from \@/lib/utils\ for conditional class merging.
7. After any change, run \pnpm --filter frontend build\ to verify zero errors.