import type { Metadata } from "next";
import type { Viewport } from "next";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import "./storefront.css";
import { ShopCartProvider } from './ShopCart';

export const metadata: Metadata = {
  title: "Qutlas | Materials, parts and making",
  description: "Source steel, wood and granite. Develop components, explore Qutters Lab, and turn project requirements into things you can make.",
  openGraph: {
    title: "Qutlas | From raw material to real things.",
    description: "Source steel, wood and granite. Start with a material, drawing or idea.",
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
