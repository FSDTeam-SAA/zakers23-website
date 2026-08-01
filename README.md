# Miami New Development Clone

This project is a `Next.js 15` + `React 19` + `TypeScript` frontend rebuild inspired by `newdev.miami`.

It includes:

- a homepage landing experience
- a separate `/map` page for the Explore Map flow
- Tailwind-powered custom UI sections
- feature-based component structure under `src/features/Home`

## Tech Stack

- `Next.js 15.4.6`
- `React 19.1.1`
- `TypeScript 5.8.3`
- `Tailwind CSS 4`
- `PostCSS`

## Available Scripts

Run development server:

```bash
pnpm dev
```

Production build:

```bash
pnpm build
```

Start production server:

```bash
pnpm start
```

Type check:

```bash
pnpm exec tsc --noEmit
```

## Routes

- `/`
  Home landing page
- `/map`
  Dedicated Explore Map page

## Project Structure

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
    map/
      page.tsx

  features/
    Home/
      components/
        advisor-section.tsx
        home-page.tsx
        newsletter-section.tsx
        site-footer.tsx
        subscriber-section.tsx
```

There are also feature folders for:

- `HeroSection`
- `FeaturedProject`
- `DiscoveryEngine`
- `Testimonials`

These contain their own `components`, `data`, `types`, and related files.

## Main UI Sections

### Homepage

The homepage currently includes:

1. Fixed navbar with logo and scroll-based blur background
2. Hero section
3. Featured Projects section
4. Owners & Investors CTA section
5. Advisor section
6. Discovery Engine section
7. Testimonials section
8. Subscriber section
9. Footer

### Explore Map Page

The `/map` page includes:

- a premium dark layout
- left filter and project list sidebar
- right interactive visual map-style panel
- selected project detail card

## Branding Assets

Project logo is currently loaded from:

```text
public/images/logo.png
```

This logo is used in:

- navbar
- advisor brand area
- footer

## Styling Notes

- Global styles live in `src/app/globals.css`
- Tailwind utility classes are used heavily in component files
- Custom CSS is still used for shared/global behaviors like:
  - navbar transitions
  - hero behavior
  - scrollbar hiding
  - section-wide legacy styles

## Metadata

Global metadata is set in:

- `src/app/layout.tsx`

Current title:

`Miami New Development | Pre-Construction Condos & Luxury New Construction`

## Notes

- This project uses `pnpm` and already includes a `pnpm-lock.yaml`
- If multiple lockfile warnings appear during build, they are environment-related and do not necessarily indicate a source code problem
- The UI is being actively tuned to match the visual style of `newdev.miami`

## Recommended Workflow

1. Run `pnpm dev`
2. Open `http://localhost:3000`
3. Test homepage and `/map`
4. Run `pnpm exec tsc --noEmit`
5. Run `pnpm build` before final delivery

## Authoring Goal

The goal of this repo is to create a luxury real-estate styled frontend with:

- editorial typography
- refined gold/cream/navy palette
- premium section layouts
- close visual parity with the referenced live site
-----------------------------------------------------------------------------------