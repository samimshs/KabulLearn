"use client";

import { useEffect, useState } from "react";

const UNREAD_KEY = "kabullearn.portal.unread";
const AVATAR_KEY = "kabullearn.portal.avatar";
const UNREAD_EVENT = "kabullearn:unread-change";
const AVATAR_EVENT = "kabullearn:avatar-change";

function readNumber(key: string, fallback = 0) {
  if (typeof window === "undefined") return fallback;
  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
}

function readString(key: string, fallback: string | null = null) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) || fallback;
}

export function setPortalUnreadCount(value: number) {
  if (typeof window === "undefined") return;
  const next = Math.max(0, value);
  window.localStorage.setItem(UNREAD_KEY, String(next));
  window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: next }));
}

export function usePortalUnreadCount(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    setCount(readNumber(UNREAD_KEY, initialValue));
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      setCount(typeof detail === "number" ? detail : readNumber(UNREAD_KEY, initialValue));
    };
    window.addEventListener(UNREAD_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(UNREAD_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [initialValue]);

  return count;
}

export function setPortalAvatarUrl(url: string | null) {
  if (typeof window === "undefined") return;
  if (url) window.localStorage.setItem(AVATAR_KEY, url);
  else window.localStorage.removeItem(AVATAR_KEY);
  window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: url }));
}

export function usePortalAvatarUrl(initialValue: string | null = null) {
  const [url, setUrl] = useState(initialValue);

  useEffect(() => {
    setUrl(readString(AVATAR_KEY, initialValue));
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<string | null>).detail;
      setUrl(typeof detail === "string" ? detail : readString(AVATAR_KEY, initialValue));
    };
    window.addEventListener(AVATAR_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(AVATAR_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [initialValue]);

  return url;
}
