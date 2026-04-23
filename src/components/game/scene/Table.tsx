// Рабочая столешница со слотами.

import { SCENE_COLORS } from "./colors";

export const TABLE_TOP_Y = 0;
export const TABLE_DEPTH = 1.4;
export const TABLE_WIDTH = 4.2;

// Координаты 5 слотов на столе (передний ряд)
export const SLOT_POSITIONS: [number, number, number][] = [
  [-1.6, TABLE_TOP_Y + 0.06, 0.35],
  [-0.8, TABLE_TOP_Y + 0.06, 0.35],
  [0, TABLE_TOP_Y + 0.06, 0.35],
  [0.8, TABLE_TOP_Y + 0.06, 0.35],
  [1.6, TABLE_TOP_Y + 0.06, 0.35],
];

// Рабочая зона (центр стола, дальше от камеры)
export const WORK_SURFACE_POS: [number, number, number] = [0, TABLE_TOP_Y + 0.06, -0.35];

export function TableSurface() {
  return (
    <group>
      {/* Столешница */}
      <mesh position={[0, TABLE_TOP_Y, 0]} castShadow receiveShadow>
        <boxGeometry args={[TABLE_WIDTH, 0.12, TABLE_DEPTH]} />
        <meshStandardMaterial color={SCENE_COLORS.woodLight} roughness={0.7} />
      </mesh>
      {/* Окантовка */}
      <mesh position={[0, TABLE_TOP_Y - 0.07, 0]}>
        <boxGeometry args={[TABLE_WIDTH + 0.04, 0.04, TABLE_DEPTH + 0.04]} />
        <meshStandardMaterial color={SCENE_COLORS.woodDark} roughness={0.8} />
      </mesh>
      {/* Ножки */}
      {(
        [
          [-TABLE_WIDTH / 2 + 0.15, -0.7, -TABLE_DEPTH / 2 + 0.15],
          [TABLE_WIDTH / 2 - 0.15, -0.7, -TABLE_DEPTH / 2 + 0.15],
          [-TABLE_WIDTH / 2 + 0.15, -0.7, TABLE_DEPTH / 2 - 0.15],
          [TABLE_WIDTH / 2 - 0.15, -0.7, TABLE_DEPTH / 2 - 0.15],
        ] as [number, number, number][]
      ).map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.14, 1.3, 0.14]} />
          <meshStandardMaterial color={SCENE_COLORS.woodDark} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
