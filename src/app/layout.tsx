import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WINTPC — What's In That PC",
  description: "A personal log of parts in every computer you own or manage.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <header className="mb-8">
            <a href="/" className="text-xl font-semibold tracking-tight">
              WINTPC
            </a>
            <p className="text-sm text-neutral-400">What&apos;s In That PC</p>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
