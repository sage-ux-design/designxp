"use client";

import { useCallback, useEffect, useState } from "react";

type Kind = "concepts" | "phrases";

const key = (kind: Kind) => `designxp:bookmarks:${kind}:v1`;
const EVENT = "designxp:bookmarks-changed";

function read(kind: Kind): string[] {
  try {
    return JSON.parse(localStorage.getItem(key(kind)) || "[]");
  } catch {
    return [];
  }
}

/** Bookmarks are a personal preference and stay in this browser's local storage. */
export function useBookmarks(kind: Kind) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage
    setIds(read(kind));
    const sync = () => setIds(read(kind));
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [kind]);

  const toggle = useCallback(
    (id: string) => {
      const current = read(kind);
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      try {
        localStorage.setItem(key(kind), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      setIds(next);
      window.dispatchEvent(new Event(EVENT));
    },
    [kind],
  );

  return { ids, has: (id: string) => ids.includes(id), toggle };
}

export function clearAllBookmarks() {
  for (const k of ["concepts", "phrases"] as Kind[]) localStorage.removeItem(key(k));
  window.dispatchEvent(new Event(EVENT));
}
