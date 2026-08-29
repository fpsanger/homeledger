"use client";

import { ChevronDown, Eye, EyeOff, Home, Menu, Moon, Sun, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import { usePrivacy } from "./PrivacyProvider";
import { useTheme } from "./ThemeProvider";

type Person = { id: string; name: string };

const navLinks = [
  { href: "/dashboard", label: "Dashboard", primary: true },
  { href: "/transactions", label: "Transações", primary: true },
  { href: "/installments", label: "Fatura cartão", primary: true },
  { href: "/credit-cards", label: "Cartões de Crédito", primary: true },
  { href: "/loyalty", label: "Milhas", primary: true },
  { href: "/billing-import", label: "Importar Extrato", primary: false },
  { href: "/categories", label: "Categorias", primary: false },
  { href: "/people", label: "Pessoas", primary: false },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function setCookie(name: string, value: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: CookieStore API lacks Safari/Firefox support
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [globalPersonId, setGlobalPersonId] = useState("");
  const { theme, toggle } = useTheme();
  const { hidden, toggle: togglePrivacy } = usePrivacy();
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    <>
      <header className="sticky top-0 z-40 h-16 border-b bg-card shadow-sm">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-full flex items-center gap-3 lg:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
              <Home className="w-4 h-4 text-primary-foreground" />
            </span>
            <span className="font-semibold text-sm tracking-tight">HomeLedger</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 min-w-0 flex-1">
            {navLinks
              .filter((l) => l.primary)
              .map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
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
                  (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
                );
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setMoreOpen((o) => !o)}
                      className={`relative flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
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
                          const active =
                            pathname === link.href || pathname.startsWith(`${link.href}/`);
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

          {/* Desktop right side */}
          <div className="hidden lg:flex ml-auto items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={togglePrivacy}
              aria-label={hidden ? "Show values" : "Hide values"}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
              className="h-8 text-sm w-36"
            >
              <option value="">Todas as pessoas</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Mobile right side */}
          <div className="flex lg:hidden ml-auto items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={togglePrivacy}
              aria-label={hidden ? "Show values" : "Hide values"}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-50 bg-black/40 md:hidden cursor-default"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-card border-r shadow-xl flex flex-col transition-transform duration-300 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b shrink-0">
          <Link
            href="/dashboard"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
              <Home className="w-4 h-4 text-primary-foreground" />
            </span>
            <span className="font-semibold text-sm tracking-tight">HomeLedger</span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col px-2 py-3 gap-1 flex-1 overflow-y-auto">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className={`px-3 py-2.5 text-sm rounded-md transition-colors ${
                  active
                    ? "text-foreground font-medium bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t flex items-center gap-2 shrink-0">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select
            value={globalPersonId}
            onChange={handleGlobalPersonChange}
            className="h-8 text-sm flex-1"
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
    </>
  );
}
