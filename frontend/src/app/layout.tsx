// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KU Volunteer",
  description: "A volunteer management platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        {/* Header */}
        <header className="w-full bg-brand-500 text-white shadow-md">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">🌸 KU Volunteer</h1>
            <nav className="space-x-4">
              <a href="/" className="hover:underline">Home</a>
              <a href="/about" className="hover:underline">About</a>
              <a href="/contact" className="hover:underline">Contact</a>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow mx-auto w-full max-w-5xl px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full bg-gray-100 text-gray-600 border-t mt-8">
          <div className="mx-auto max-w-5xl px-6 py-4 text-sm text-center">
            © {new Date().getFullYear()} KU Volunteer. Built with ❤️ using Next.js & TailwindCSS.
          </div>
        </footer>
      </body>
    </html>
  );
}
