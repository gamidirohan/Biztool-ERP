"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { AppHeader } from "@/components/ui/app-header";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityProjectId = process.env.NEXT_PUBLIC_MS_CLARITY_ID;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {clarityProjectId ? (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);
  t.async=1;
  t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];
  y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${clarityProjectId}");`}
          </Script>
        ) : null}
        <ThemeProvider>
          {/* AppHeader is hidden on mobile (< 768px) as dashboard and other pages have their own mobile layouts */}
          <div className="hidden md:block">
            <AppHeader />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}