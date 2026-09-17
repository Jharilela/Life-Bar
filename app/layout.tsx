import type { Metadata } from "next";
import { Pixelify_Sans, Karla, Space_Mono } from "next/font/google";
import "./globals.css";

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dataFont = Space_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "LifeBar",
  description:
    "Your own health record: visits, medications, and vitals, in your control.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${karla.variable} ${dataFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
