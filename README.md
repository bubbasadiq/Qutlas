# Qutlas: Programmable Materials Manufacturing

A modern landing page built with Next.js 16 for Qutlas, a company building the infrastructure for programmable materials manufacturing.

## Features

- **Interactive 3D Canvas**: Real-time Three.js visualization of a network
- **Custom Cursor**: Animated custom cursor that responds to interactive elements
- **Responsive Design**: Mobile-first design that works seamlessly across all devices
- **Scroll Animations**: Smooth reveal animations as you scroll through sections
- **Modern Aesthetics**: Sophisticated navy and amber color scheme with smooth transitions
- **Accessible**: Semantic HTML and ARIA labels throughout

## Tech Stack

- **Framework**: Next.js 16
- **Styling**: CSS with CSS variables
- **3D Graphics**: Three.js
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
│   ├── page.tsx          # Main landing page with all sections
│   └── globals.css       # Global styles and CSS variables
├── public/
│   └── icon_logo.png     # Qutlas logo
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── next.config.js        # Next.js configuration
└── .eslintrc.json        # ESLint configuration
```

## Sections

1. **Navigation**: Fixed header with logo and navigation links, with mobile menu
2. **Hero**: Animated introduction with Three.js background
3. **Problem**: Description of manufacturing challenges
4. **Platform**: Five-layer system architecture
5. **Basalt**: Information about the first material
6. **Vision**: Future possibilities statement
7. **Contact**: Form for inquiries
8. **Footer**: Company information and links

## Customization

### Colors

Edit the CSS variables in `app/globals.css`:

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
