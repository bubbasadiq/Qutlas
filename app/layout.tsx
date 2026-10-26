import type { Metadata } from "next";
import type { Viewport } from "next";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import "./storefront.css";
import { ShopCartProvider } from './ShopCart';

export const metadata: Metadata = {
  title: "Qutlas | Materials, parts and fabrication", 
  description: "Source materials, request cut-to-size components, and bring project requirements together with Qutlas.",
  openGraph: {
    title: "Qutlas | Materials in. Possibilities out.",
    description: "Source steel, wood, tiles and granite. Start a project with Qutlas.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ShopCartProvider>
          <SiteHeader />
          {children}
        </ShopCartProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
