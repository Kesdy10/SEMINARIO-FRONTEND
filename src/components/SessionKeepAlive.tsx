"use client";

import { useKeepAlive } from "@/hooks/useKeepAlive";

export default function SessionKeepAlive() {
  useKeepAlive();

  return null;
}