"use client";

import { useState, useEffect } from "react";

export function useTime() {
  const [time, setTime] = useState({ hour: 12, formatted: "" });
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({
        hour: now.getHours(),
        formatted: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);
  return isClient;
}
