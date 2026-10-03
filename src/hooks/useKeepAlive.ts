"use client";

import { useEffect, useRef } from "react";
import * as authService from "@/services/auth";
import { useAuth } from "@/hooks/useAuth";

const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // 5 minutos

export function useKeepAlive() {
  const { user } = useAuth();
  const lastActivityRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    // Registra la última actividad realizada por el usuario.
    const registerActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, registerActivity);
    });

    // Cada 5 minutos verifica si hubo actividad.
    const interval = window.setInterval(async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      if (timeSinceLastActivity < KEEP_ALIVE_INTERVAL) {
        try {
          await authService.getMe();
        } catch {
          // La sesión expirada será manejada por la lógica de autenticación.
        }
      }
    }, KEEP_ALIVE_INTERVAL);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, registerActivity);
      });

      window.clearInterval(interval);
    };
  }, [user]);
}