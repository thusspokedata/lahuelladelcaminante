"use client";

import { useLocale } from "next-intl";
import { formatDateByLocale, formatDateShortByLocale } from "@/lib/utils";
import { SupportedLocale } from "@/types";

/**
 * Hook para formatear fechas según el idioma activo de la aplicación
 * @returns Objeto con funciones para formatear fechas
 */
export function useLocalizedDate() {
  const locale = useLocale() as SupportedLocale;

  return {
    /**
     * Formatea una fecha con el día de la semana incluido según el idioma actual
     * @param dateString - Fecha en formato string
     * @returns Fecha formateada (ej. "Lunes, 1 de enero, 2023")
     */
    format: (dateString: string) => formatDateByLocale(dateString, locale),

    /**
     * Formatea una fecha sin el día de la semana según el idioma actual
     * @param dateString - Fecha en formato string
     * @returns Fecha formateada en formato corto (ej. "1 de enero, 2023")
     */
    formatShort: (dateString: string) => formatDateShortByLocale(dateString, locale),
  };
}
