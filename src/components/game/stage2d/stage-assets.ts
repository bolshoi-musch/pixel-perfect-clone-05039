// Единый реестр путей к PNG-ассетам кухни (стиль Isometric Kitchen Sprites).
// Все пути — public/, доступны как обычные URL.
// Ничего больше из других паков не подмешиваем, чтобы стиль оставался единым.

export const STAGE_ASSETS = {
  stove: "/assets/sprites/iso/stove.png",
  kettle: "/assets/sprites/iso/kettle.png",
  bowl: "/assets/sprites/iso/bowl.png",
  plate: "/assets/sprites/iso/plate.png",
  cup: "/assets/sprites/iso/cup.png",
  toaster: "/assets/sprites/iso/toaster.png",
  counter: "/assets/sprites/iso/counter.png",
} as const;

export type StageAssetId = keyof typeof STAGE_ASSETS;
