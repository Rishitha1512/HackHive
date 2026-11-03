"use client";

import { useAppContext } from "@/context/AppContext";

export function useAuth() {
  return useAppContext();
}