"use client";

import { createContext, useContext, useEffect, useState } from "react";

const PrivacyContext = createContext<{ hidden: boolean; toggle: () => void }>({
  hidden: false,
  toggle: () => {},
});

export function usePrivacy() {
  return useContext(PrivacyContext);
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("hideValues");
    if (stored === "true") setHidden(true);
  }, []);

  function toggle() {
    setHidden((prev) => {
      const next = !prev;
      localStorage.setItem("hideValues", String(next));
      return next;
    });
  }

  return <PrivacyContext.Provider value={{ hidden, toggle }}>{children}</PrivacyContext.Provider>;
}
