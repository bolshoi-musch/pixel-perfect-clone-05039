// Реестр фиксированных слотов кухни.
// Слот = именованная позиция в сцене, к которой может быть привязан объект.
// Используется как мост между логической моделью кухни и любым визуальным слоем
// (текущая 3D-сцена, будущая 2.5D-сцена).

import { EQUIPMENT_POSITIONS, TABLE_SLOT_POSITIONS, WORK_SURFACE_POSITION, type Vec3 } from "./kitchen-layout";

export type KitchenSlotId =
  | "stove_slot"
  | "bowl_slot"
  | "plate_slot"
  | "cup_slot"
  | "kettle_slot"
  | "bell_slot"
  | "toaster_slot"
  | "blender_slot"
  | "rice_cooker_slot"
  | "work_surface_slot"
  | "extra_slot_1"
  | "extra_slot_2"
  | "table_slot_1"
  | "table_slot_2"
  | "table_slot_3"
  | "table_slot_4"
  | "table_slot_5";

export interface KitchenSlot {
  id: KitchenSlotId;
  /** Человекочитаемое имя для UI/отладки. */
  label: string;
  /** Мировые координаты в текущей 3D-сцене (для 2.5D будет mapping). */
  position: Vec3;
  /** Может ли слот принимать ингредиенты со стола. */
  acceptsIngredients: boolean;
}

/**
 * Главный реестр слотов. Источник истины для позиций — kitchen-layout.ts.
 * Здесь добавляется только семантика «именованного слота».
 */
export const KITCHEN_SLOTS: Record<KitchenSlotId, KitchenSlot> = {
  stove_slot: {
    id: "stove_slot",
    label: "Слот плиты",
    position: EQUIPMENT_POSITIONS.stove,
    acceptsIngredients: false,
  },
  bowl_slot: {
    id: "bowl_slot",
    label: "Слот миски",
    position: EQUIPMENT_POSITIONS.bowl,
    acceptsIngredients: false,
  },
  plate_slot: {
    id: "plate_slot",
    label: "Слот тарелки",
    position: EQUIPMENT_POSITIONS.plate,
    acceptsIngredients: false,
  },
  cup_slot: {
    id: "cup_slot",
    label: "Слот чашки",
    position: EQUIPMENT_POSITIONS.cup,
    acceptsIngredients: false,
  },
  kettle_slot: {
    id: "kettle_slot",
    label: "Слот чайника",
    position: EQUIPMENT_POSITIONS.kettle,
    acceptsIngredients: false,
  },
  bell_slot: {
    id: "bell_slot",
    label: "Слот звонка",
    position: EQUIPMENT_POSITIONS.bell,
    acceptsIngredients: false,
  },
  toaster_slot: {
    id: "toaster_slot",
    label: "Слот тостера",
    position: EQUIPMENT_POSITIONS.toaster,
    acceptsIngredients: false,
  },
  blender_slot: {
    id: "blender_slot",
    label: "Слот блендера",
    position: EQUIPMENT_POSITIONS.blender,
    acceptsIngredients: false,
  },
  rice_cooker_slot: {
    id: "rice_cooker_slot",
    label: "Слот рисоварки",
    position: EQUIPMENT_POSITIONS.rice_cooker,
    acceptsIngredients: false,
  },
  work_surface_slot: {
    id: "work_surface_slot",
    label: "Рабочая зона",
    position: WORK_SURFACE_POSITION,
    acceptsIngredients: false,
  },
  // Резервные слоты — пока неиспользуемые, чтобы зарезервировать структуру под будущие объекты.
  extra_slot_1: {
    id: "extra_slot_1",
    label: "Доп. слот 1",
    position: [-2.0, 0.06, -0.4],
    acceptsIngredients: false,
  },
  extra_slot_2: {
    id: "extra_slot_2",
    label: "Доп. слот 2",
    position: [2.0, 0.06, -0.4],
    acceptsIngredients: false,
  },
  // Слоты переднего ряда — хранение продуктов.
  table_slot_1: {
    id: "table_slot_1",
    label: "Стол 1",
    position: TABLE_SLOT_POSITIONS[0],
    acceptsIngredients: true,
  },
  table_slot_2: {
    id: "table_slot_2",
    label: "Стол 2",
    position: TABLE_SLOT_POSITIONS[1],
    acceptsIngredients: true,
  },
  table_slot_3: {
    id: "table_slot_3",
    label: "Стол 3",
    position: TABLE_SLOT_POSITIONS[2],
    acceptsIngredients: true,
  },
  table_slot_4: {
    id: "table_slot_4",
    label: "Стол 4",
    position: TABLE_SLOT_POSITIONS[3],
    acceptsIngredients: true,
  },
  table_slot_5: {
    id: "table_slot_5",
    label: "Стол 5",
    position: TABLE_SLOT_POSITIONS[4],
    acceptsIngredients: true,
  },
};

/** Все table-слоты в порядке индексов (0..4). */
export const TABLE_SLOT_IDS: KitchenSlotId[] = [
  "table_slot_1",
  "table_slot_2",
  "table_slot_3",
  "table_slot_4",
  "table_slot_5",
];
