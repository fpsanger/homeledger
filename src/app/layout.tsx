import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "HomeLedger",
  description: "Household finance tracker",
};

const navLinks = [
  { href: "/monthly-view", label: "Monthly View" },
  { href: "/transactions", label: "Transactions" },
  { href: "/installments", label: "Installments" },
  { href: "/credit-cards", label: "Credit Cards" },
  { href: "/categories", label: "Categories" },
  { href: "/people", label: "People" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="border-b bg-background px-6 py-3 flex gap-6 items-center">
          <span className="font-semibold text-sm tracking-tight mr-4">HomeLedger</span>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="px-6 py-6 max-w-4xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
