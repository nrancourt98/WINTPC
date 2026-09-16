import { z } from "zod";
import { PartCategory } from "@prisma/client";

export type FieldType = "text" | "number" | "select";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  unit?: string;
}

interface CategoryDef {
  label: string;
  fields: FieldDef[];
  schema: z.ZodTypeAny;
}

const text = () => z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const num = () =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number().optional()
  );

function schemaFor(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    shape[f.key] = f.type === "number" ? num() : text();
  }
  return z.object(shape);
}

const CPU_FIELDS: FieldDef[] = [
  { key: "manufacturer", label: "Manufacturer", type: "select", options: ["Intel", "AMD", "Other"] },
  { key: "model", label: "Model", type: "text" },
  { key: "coreCount", label: "Cores", type: "number" },
  { key: "threadCount", label: "Threads", type: "number" },
  { key: "baseClockGHz", label: "Base Clock", type: "number", unit: "GHz" },
  { key: "boostClockGHz", label: "Boost Clock", type: "number", unit: "GHz" },
  { key: "socket", label: "Socket", type: "text" },
  { key: "tdpWatts", label: "TDP", type: "number", unit: "W" },
];

const MOTHERBOARD_FIELDS: FieldDef[] = [
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "chipset", label: "Chipset", type: "text" },
  { key: "socket", label: "Socket", type: "text" },
  { key: "formFactor", label: "Form Factor", type: "select", options: ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX", "Other"] },
  { key: "ramSlots", label: "RAM Slots", type: "number" },
  { key: "maxRamGB", label: "Max RAM", type: "number", unit: "GB" },
];

const RAM_FIELDS: FieldDef[] = [
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "capacityGB", label: "Capacity", type: "number", unit: "GB" },
  { key: "speedMHz", label: "Speed", type: "number", unit: "MHz" },
  { key: "moduleCount", label: "Module Count", type: "number" },
  { key: "type", label: "Type", type: "select", options: ["DDR3", "DDR4", "DDR5"] },
  { key: "timings", label: "Timings", type: "text" },
];

const GPU_FIELDS: FieldDef[] = [
  { key: "manufacturer", label: "Manufacturer", type: "select", options: ["NVIDIA", "AMD", "Intel", "Other"] },
  { key: "model", label: "Model", type: "text" },
  { key: "vramGB", label: "VRAM", type: "number", unit: "GB" },
  { key: "coreClockMHz", label: "Core Clock", type: "number", unit: "MHz" },
  { key: "powerDrawWatts", label: "Power Draw", type: "number", unit: "W" },
  { key: "lengthMM", label: "Length", type: "number", unit: "mm" },
];

const STORAGE_FIELDS: FieldDef[] = [
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "capacityGB", label: "Capacity", type: "number", unit: "GB" },
  { key: "type", label: "Type", type: "select", options: ["NVMe SSD", "SATA SSD", "HDD"] },
  { key: "formFactor", label: "Form Factor", type: "select", options: ["M.2", "2.5\"", "3.5\""] },
  { key: "readSpeedMBs", label: "Read Speed", type: "number", unit: "MB/s" },
  { key: "writeSpeedMBs", label: "Write Speed", type: "number", unit: "MB/s" },
];

const PSU_FIELDS: FieldDef[] = [
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "wattage", label: "Wattage", type: "number", unit: "W" },
  { key: "efficiencyRating", label: "Efficiency Rating", type: "select", options: ["80+ White", "80+ Bronze", "80+ Silver", "80+ Gold", "80+ Platinum", "80+ Titanium"] },
  { key: "modularity", label: "Modularity", type: "select", options: ["Non-Modular", "Semi-Modular", "Fully Modular"] },
  { key: "formFactor", label: "Form Factor", type: "select", options: ["ATX", "SFX", "SFX-L", "Other"] },
];

const CASE_FIELDS: FieldDef[] = [
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "formFactorSupport", label: "Form Factor Support", type: "text" },
  { key: "dimensions", label: "Dimensions", type: "text" },
  { key: "fanMounts", label: "Fan Mounts", type: "text" },
];

const COOLING_FIELDS: FieldDef[] = [
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "type", label: "Type", type: "select", options: ["Air", "AIO Liquid", "Custom Loop"] },
  { key: "radiatorSizeMM", label: "Radiator Size", type: "number", unit: "mm" },
  { key: "fanCount", label: "Fan Count", type: "number" },
  { key: "socketCompatibility", label: "Socket Compatibility", type: "text" },
];

export const CATEGORY_ORDER: PartCategory[] = [
  PartCategory.CPU,
  PartCategory.MOTHERBOARD,
  PartCategory.RAM,
  PartCategory.GPU,
  PartCategory.STORAGE,
  PartCategory.PSU,
  PartCategory.CASE,
  PartCategory.COOLING,
  PartCategory.OTHER,
];

export const CATEGORIES: Record<PartCategory, CategoryDef> = {
  CPU: { label: "CPU", fields: CPU_FIELDS, schema: schemaFor(CPU_FIELDS) },
  MOTHERBOARD: { label: "Motherboard", fields: MOTHERBOARD_FIELDS, schema: schemaFor(MOTHERBOARD_FIELDS) },
  RAM: { label: "RAM", fields: RAM_FIELDS, schema: schemaFor(RAM_FIELDS) },
  GPU: { label: "GPU", fields: GPU_FIELDS, schema: schemaFor(GPU_FIELDS) },
  STORAGE: { label: "Storage", fields: STORAGE_FIELDS, schema: schemaFor(STORAGE_FIELDS) },
  PSU: { label: "PSU", fields: PSU_FIELDS, schema: schemaFor(PSU_FIELDS) },
  CASE: { label: "Case", fields: CASE_FIELDS, schema: schemaFor(CASE_FIELDS) },
  COOLING: { label: "Cooling", fields: COOLING_FIELDS, schema: schemaFor(COOLING_FIELDS) },
  OTHER: { label: "Other", fields: [], schema: z.object({}) },
};

export function isPartCategory(value: string): value is PartCategory {
  return (CATEGORY_ORDER as string[]).includes(value);
}

export function categoryRank(category: PartCategory): number {
  const idx = CATEGORY_ORDER.indexOf(category);
  return idx === -1 ? CATEGORY_ORDER.length : idx;
}
