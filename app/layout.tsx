import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MissionProvider } from "@/components/mission-provider";
import { UniversalNav } from "@/components/universal-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kaftan Adobe Creative Mission Control",
  description: "Discover globally. Execute locally. Resume seamlessly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <MissionProvider>
          <UniversalNav />
          <main className="app-shell">{children}</main>
        </MissionProvider>
      </body>
    </html>
  );
}
