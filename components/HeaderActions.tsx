"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const FAVORITES_EVENT = "favoriteschange";
const THEME_EVENT = "themechange";

const EMPTY_IDS: string[] = [];

// useSyncExternalStore 要求快照引用稳定：底层数据未变时必须返回同一引用，
// 否则会触发无限重渲染（导致内存溢出 / 页面崩溃）。这里按原始字符串缓存。
let favCacheRaw = "";
let favCache: string[] = EMPTY_IDS;

function readFavorites(): string[] {
  if (typeof window === "undefined") return EMPTY_IDS;
  try {
    const raw = localStorage.getItem("favorites") || "[]";
    if (raw !== favCacheRaw) {
      favCacheRaw = raw;
      const list = JSON.parse(raw);
      favCache = Array.isArray(list) ? list.map(String) : EMPTY_IDS;
    }
    return favCache;
  } catch {
    return EMPTY_IDS;
  }
}

function getServerFavorites(): string[] {
  return EMPTY_IDS;
}

function subscribeFavorites(onStoreChange: () => void) {
  window.addEventListener("focus", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(FAVORITES_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("focus", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(FAVORITES_EVENT, onStoreChange);
  };
}

export function useFavoriteIds() {
  return useSyncExternalStore(
    subscribeFavorites,
    readFavorites,
    getServerFavorites
  );
}

export function saveFavoriteIds(ids: string[]) {
  try {
    localStorage.setItem("favorites", JSON.stringify(ids));
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  } catch {}
}

function readLightTheme() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("light");
}

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

export function ThemeToggle() {
  const light = useSyncExternalStore(subscribeTheme, readLightTheme, () => false);

  function toggle() {
    const isLight = document.documentElement.classList.toggle("light");
    try {
      localStorage.setItem("theme", isLight ? "light" : "dark");
    } catch {}
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      onClick={toggle}
      aria-label="切换主题"
      title={light ? "切换到深色" : "切换到浅色"}
      className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-base transition-colors"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
      }}
    >
      {light ? "🌙" : "☀️"}
    </button>
  );
}

export function FavoritesButton() {
  const count = useFavoriteIds().length;

  return (
    <Link
      href="/favorites"
      title="我的收藏箱"
      className="shrink-0 relative inline-flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-medium transition-colors"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
      }}
    >
      <span>🗃️</span>
      <span className="hidden sm:inline">收藏箱</span>
      {count > 0 && (
        <span
          className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export default function HeaderActions() {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <FavoritesButton />
      <ThemeToggle />
    </div>
  );
}
