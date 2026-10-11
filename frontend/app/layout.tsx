import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@fontsource/metropolis/400.css";
import "@fontsource/metropolis/500.css";
import "@fontsource/metropolis/600.css";
import "@fontsource/metropolis/700.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Talaghayan | Barangay report tracker", template: "%s | Talaghayan" },
  description: "File barangay reports, track compliance and review submissions with Talaghayan.",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F0F4FF] text-slate-800 dark:bg-[#0A0B1A] dark:text-slate-200 transition-colors duration-500 ease-out">
        {/* Global Vibrant Mesh Background */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#A8B1FF]/50 dark:bg-[#3D228A]/50 blur-[120px] transition-colors duration-500 ease-out animate-blob" />
          <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#82E6FF]/50 dark:bg-[#004B73]/50 blur-[120px] transition-colors duration-500 ease-out animate-blob" style={{ animationDelay: '8s' }} />
          <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-[#E5B5FF]/50 dark:bg-[#602080]/50 blur-[120px] transition-colors duration-500 ease-out animate-blob" style={{ animationDelay: '16s' }} />
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
