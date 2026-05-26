"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, User, Sun, Moon, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import { useTheme } from "./ThemeProvider";

type Person = { id: string; name: string };

const navLinks = [
  { href: "/dashboard",      label: "Dashboard",         primary: true },
  { href: "/transactions",   label: "Transações",         primary: true },
  { href: "/installments",   label: "Parcelas",           primary: true },
  { href: "/credit-cards",   label: "Cartões de Crédito", primary: true },
  { href: "/loyalty",        label: "Milhas",             primary: true },
  { href: "/billing-import", label: "Importar Extrato",   primary: false },
  { href: "/categories",     label: "Categorias",         primary: false },
  { href: "/people",         label: "Pessoas",            primary: false },
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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          {navLinks.filter((l) => l.primary).map((link) => {
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

          <div ref={moreRef} className="relative">
            {(() => {
              const secondaryLinks = navLinks.filter((l) => !l.primary);
              const anySecondaryActive = secondaryLinks.some(
                (l) => pathname === l.href || pathname.startsWith(l.href + "/")
              );
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setMoreOpen((o) => !o)}
                    className={`relative flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                      anySecondaryActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    Mais
                    <ChevronDown className="w-3 h-3" />
                    {anySecondaryActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>

                  {moreOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 rounded-md border bg-card shadow-md z-50 py-1">
                      {secondaryLinks.map((link) => {
                        const active = pathname === link.href || pathname.startsWith(link.href + "/");
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMoreOpen(false)}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              active
                                ? "text-foreground font-medium bg-muted"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
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
