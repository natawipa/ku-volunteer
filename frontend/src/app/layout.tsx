import type { Metadata } from "next";
import { Nunito, Mitr } from 'next/font/google';
import "./globals.css";

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-nunito',
});

const mitr = Mitr({
  subsets: ['latin', 'thai'],
  weight: ['200', '300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-mitr',
});

export const metadata: Metadata = {
  title: "KU Volunteer",
  description: "Kasetsart University Volunteer Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="th">
//       <body className={`${nunito.variable} ${mitr.variable} font-nunito antialiased`}>
//         {children}
//       </body>
//     </html>
//   )
// }