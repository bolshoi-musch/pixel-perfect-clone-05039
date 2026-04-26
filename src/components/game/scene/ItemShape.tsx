// Простая визуализация item id → low-poly mesh.
// Используется в слотах стола и для overlay на bowl/plate/cup.

import { getItemVisual, type VisualShape } from "@/game/item-visuals";

interface ItemShapeProps {
  itemId: string;
  /** Масштаб относительно базового размера (≈0.12 рад). */
  scale?: number;
  /** Y-смещение базы (по умолчанию 0). */
  yOffset?: number;
}

export function ItemShape({ itemId, scale = 1, yOffset = 0 }: ItemShapeProps) {
  const v = getItemVisual(itemId);
  if (!v) return null;
  const color = v.color;
  const shape: VisualShape = v.shape;

  switch (shape) {
    case "egg":
      return (
        <mesh castShadow position={[0, 0.05 + yOffset, 0]} scale={[scale, scale * 1.3, scale]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      );
    case "leaves":
      // Маленькая «кучка» приплюснутых сфер
      return (
        <group position={[0, 0.02 + yOffset, 0]} scale={scale}>
          {[
            [0, 0, 0],
            [0.05, 0, 0.03],
            [-0.05, 0, -0.02],
            [0.02, 0.02, -0.04],
          ].map((p, i) => (
            <mesh key={i} castShadow position={p as [number, number, number]} scale={[1, 0.4, 1]}>
              <sphereGeometry args={[0.05, 12, 10]} />
              <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
          ))}
        </group>
      );
    case "liquid":
      // Плоский диск-«поверхность жидкости»
      return (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.005 + yOffset, 0]}
          scale={scale}
        >
          <circleGeometry args={[0.09, 24]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
        </mesh>
      );
    case "omelet":
      return (
        <mesh
          castShadow
          position={[0, 0.02 + yOffset, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={scale}
        >
          <cylinderGeometry args={[0.13, 0.11, 0.04, 24]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      );
    case "sphere":
    default:
      return (
        <mesh castShadow position={[0, 0.05 + yOffset, 0]} scale={scale}>
          <sphereGeometry args={[0.1, 18, 18]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      );
  }
}
