import type { Metadata } from "next";
import { Nunito, Mitr } from 'next/font/google';
import "./globals.css";
import { ModalProvider } from "../app/components/Modal";

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-nunito', });

const mitr = Mitr({ subsets: ['latin', 'thai'], weight: ['200', '300', '400', '500', '600', '700'], display: 'swap', variable: '--font-mitr',  });

export const metadata: Metadata = {
  title: "KU Volunteer",
  description: "Kasetsart University Volunteer Platform",
};

export default function RootLayout({
  children,

}: {
  children: React.ReactNode;

}) {
  return (
    <html lang="en" className={`${nunito.variable} ${mitr.variable}`}>
      <body className="antialiased">
        <ModalProvider>
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}