import { differenceInCalendarDays, format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { Extinguisher } from "@/types";

export const SOON_DAYS = 30;
export const LS_KEY = "kExtintorExtinguishers";
export const LS_PLANT = "kExtintorPlant";
export const LS_DRAFT = "kExtintorDraft";

export type EquipmentStatus = "vigente" | "proximo" | "vencido";

export type PlantProfile = {
  name: string;
  code: string;
  supervisor: string;
};

export const DEFAULT_PLANT: PlantProfile = {
  name: "Planta Monterrey",
  code: "MX-MTY-01",
  supervisor: "",
};

export function getStatus(expiryDate: Date): EquipmentStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(new Date(expiryDate), today);
  if (days < 0) return "vencido";
  if (days <= SOON_DAYS) return "proximo";
  return "vigente";
}

export function statusLabel(status: EquipmentStatus) {
  if (status === "vigente") return "Vigente";
  if (status === "proximo") return "Próximo a vencer";
  return "Vencido";
}

export function displayCode(ext: Extinguisher) {
  if (ext.code) return ext.code;
  if (ext.id.startsWith("EXT-")) return ext.id;
  return ext.id.slice(0, 8).toUpperCase();
}

export function nextCode(list: Extinguisher[]) {
  let max = 0;
  for (const item of list) {
    const code = item.code || (item.id.startsWith("EXT-") ? item.id : "");
    const match = code.match(/(\d+)\s*$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `EXT-${String(max + 1).padStart(4, "0")}`;
}

export function formatShort(date: Date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";
  return format(date, "dd MMM yyyy", { locale: es });
}

export function parseLooseDate(value: string): Date | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const formats = ["yyyy-MM-dd", "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "d MMM yyyy", "dd MMM yyyy"];
  for (const pattern of formats) {
    const parsed = parse(cleaned, pattern, new Date(), { locale: es });
    if (isValid(parsed)) return parsed;
  }
  const native = new Date(cleaned);
  return isValid(native) ? native : null;
}

export function toDateInput(date?: Date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
}

export function compliancePercent(list: Extinguisher[]) {
  if (list.length === 0) return 0;
  const vigentes = list.filter((item) => getStatus(item.expiryDate) === "vigente").length;
  return Math.round((vigentes / list.length) * 1000) / 10;
}

export function hydrateExtinguisher(raw: Extinguisher): Extinguisher {
  return {
    ...raw,
    dateOfManufacture: new Date(raw.dateOfManufacture),
    expiryDate: new Date(raw.expiryDate),
  };
}
