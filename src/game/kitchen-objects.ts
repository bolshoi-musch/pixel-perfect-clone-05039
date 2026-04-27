// Реестр кухонных объектов (mapping equipment_id → визуальный/логический объект).
// Источник истины для:
//   — какой объект существует в сцене,
//   — где он находится (slotId),
//   — кликабелен ли он по умолчанию,
//   — отображается ли всегда или только при покупке.
//
// Используется сценой и любыми UI-надстройками. Не содержит R3F-кода — чистая модель.

import type { KitchenSlotId } from "./kitchen-slots";

export type KitchenObjectType =
  | "appliance" // активный прибор: плита, чайник, тостер, блендер, рисоварка
  | "vessel" // ёмкость: миска, чашка, тарелка
  | "trigger" // звонок
  | "surface"; // рабочая зона / стол

export interface KitchenObject {
  /** Совпадает с equipment_id из data/equipment.json и step.requires. */
  id: string;
  /** Человекочитаемое имя для HUD. */
  label: string;
  /** Слот, в котором живёт объект. */
  slotId: KitchenSlotId;
  /** Можно ли по нему кликать в сцене. */
  interactive: boolean;
  /**
   * Когда объект показывается:
   *   "always"       — всегда (стандартная посуда, плита, звонок),
   *   "if_owned"     — только если игрок купил этот equipment.
   */
  visible: "always" | "if_owned";
  type: KitchenObjectType;
}

export const KITCHEN_OBJECTS: KitchenObject[] = [
  {
    id: "stove",
    label: "Плита",
    slotId: "stove_slot",
    interactive: true,
    visible: "always",
    type: "appliance",
  },
  {
    id: "bowl",
    label: "Миска",
    slotId: "bowl_slot",
    interactive: true,
    visible: "always",
    type: "vessel",
  },
  {
    id: "plate",
    label: "Тарелка",
    slotId: "plate_slot",
    interactive: true,
    visible: "always",
    type: "vessel",
  },
  {
    id: "cup",
    label: "Чашка",
    slotId: "cup_slot",
    interactive: true,
    visible: "always",
    type: "vessel",
  },
  {
    id: "kettle",
    label: "Чайник",
    slotId: "kettle_slot",
    interactive: true,
    visible: "if_owned",
    type: "appliance",
  },
  {
    id: "bell",
    label: "Звонок",
    slotId: "bell_slot",
    interactive: true,
    visible: "always",
    type: "trigger",
  },
  {
    id: "toaster",
    label: "Тостер",
    slotId: "toaster_slot",
    interactive: true,
    visible: "if_owned",
    type: "appliance",
  },
  {
    id: "blender",
    label: "Блендер",
    slotId: "blender_slot",
    interactive: true,
    visible: "if_owned",
    type: "appliance",
  },
  {
    id: "rice_cooker",
    label: "Рисоварка",
    slotId: "rice_cooker_slot",
    interactive: true,
    visible: "if_owned",
    type: "appliance",
  },
  {
    id: "work_surface",
    label: "Рабочая зона",
    slotId: "work_surface_slot",
    interactive: true,
    visible: "always",
    type: "surface",
  },
];

export const KITCHEN_OBJECTS_BY_ID: Map<string, KitchenObject> = new Map(
  KITCHEN_OBJECTS.map((o) => [o.id, o]),
);

export function getKitchenObject(id: string): KitchenObject | undefined {
  return KITCHEN_OBJECTS_BY_ID.get(id);
}

/** Объект видим в сцене с учётом купленной техники. */
export function isObjectVisible(obj: KitchenObject, equipmentOwned: readonly string[]): boolean {
  if (obj.visible === "always") return true;
  return equipmentOwned.includes(obj.id);
}
