# Qutlas: Materials and Custom Manufacturing

A Next.js site for material supply and custom manufacturing project requests in Nigeria.

## Features

- **Material discovery**: Steel, wood, tiles and granite, with category-specific project details
- **Responsive design**: Desktop and mobile layouts using the existing navy/amber identity
- **Accessible controls**: Semantic labels, keyboard-friendly steps, focus states and validation
- **Project configurator**: Progressive material-specific quote flow for steel, wood, tiles and granite, with drawing/idea entry points and a review step

The project flow does not persist submissions or upload files. Quote drafts default to `support@qutlas.com`; business enquiries default to `hello@qutlas.com`. Customers must review and send email drafts themselves and attach their design files. Override recipients with `NEXT_PUBLIC_QUOTE_EMAIL` and `NEXT_PUBLIC_BUSINESS_EMAIL`. See [docs/manufacturing-workflow.md](docs/manufacturing-workflow.md) and [docs/sendcutsend-benchmark.md](docs/sendcutsend-benchmark.md) for workflow details.

## Tech Stack

- **Framework**: Next.js 16
- **Styling**: CSS with existing Qutlas palette and typography
- **React Version**: 19.0.0

## Getting Started

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the site.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx          # Materials homepage
│   ├── ProjectConfigurator.tsx # Multi-step project request
│   ├── project/page.tsx  # Preselected project route
│   └── storefront.css    # Homepage and configurator styles
├── public/
│   └── icon_logo.png     # Qutlas logo
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── next.config.js        # Next.js configuration
└── .eslintrc.json        # ESLint configuration
```

## Sections

1. **Homepage**: Materials, project entry routes, buying steps, use cases and business requirements
2. **Project configurator**: Progressive material selection, specifications, contact details and review

## Customization

### Colors

Edit the CSS variables in `app/storefront.css`:

```css
:root {
  --navy: #2b2f8c;
  --amber: #ffaa00;
  /* ... other colors ... */
}
```

### Fonts

The project uses Google Fonts:
- **DM Serif Display**: Headings
- **Rubik**: Body text
- **IBM Plex Mono**: Code and labels

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - All rights reserved © 2024 Qutlas
