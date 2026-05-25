"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, User, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/select";
import { useTheme } from "./ThemeProvider";

type Person = { id: string; name: string };

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transações" },
  { href: "/installments", label: "Parcelas" },
  { href: "/credit-cards", label: "Cartões de Crédito" },
  { href: "/loyalty", label: "Milhas" },
  { href: "/categories", label: "Categorias" },
  { href: "/people", label: "Pessoas" },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [globalPersonId, setGlobalPersonId] = useState("");
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setGlobalPersonId(getCookie("global-person-id"));
    fetch("/api/people")
      .then((r) => (r.ok ? r.json() : { people: [] }))
      .then((d) => setPeople(d.people ?? []));
  }, []);

  function handleGlobalPersonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setGlobalPersonId(value);
    setCookie("global-person-id", value);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-card shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
            <Home className="w-4 h-4 text-primary-foreground" />
          </span>
          <span className="font-semibold text-sm tracking-tight">HomeLedger</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 text-sm rounded-md transition-colors ${
                  active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <User className="w-4 h-4 text-muted-foreground" />
          <Select
            value={globalPersonId}
            onChange={handleGlobalPersonChange}
            className="h-8 text-sm w-40"
          >
            <option value="">Todas as pessoas</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </header>
  );
}
