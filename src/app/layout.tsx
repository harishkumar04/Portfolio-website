import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Beyond the Horizon | R Harish Kumar, Cloud & DevOps Engineer";
const description = "An interactive harbor portfolio of R Harish Kumar: cloud, DevOps and platform engineering projects, skills and experience.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", images: [{ url: "/art/harbor/plate.webp", width: 1672, height: 941 }] },
  twitter: { card: "summary_large_image", title, description, images: ["/art/harbor/plate.webp"] },
};

export const viewport: Viewport = { themeColor: "#0b1226", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0b1226] text-[#f3e6d0]">{children}</body>
    </html>
  );
}
