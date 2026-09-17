"use client";

import { useSyncExternalStore } from "react";

import { localToday, type DayKey } from "@/lib/calendar/month";

const subscribe = () => () => {};

/**
 * "Hoje" no fuso do navegador. Via useSyncExternalStore para que a hidratação
 * use o valor do servidor e, logo depois, o do cliente — sem mismatch.
 */
export function useToday(): DayKey {
  return useSyncExternalStore(subscribe, localToday, localToday);
}
