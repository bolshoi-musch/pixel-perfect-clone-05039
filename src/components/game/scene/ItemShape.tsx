// Простая визуализация item id → low-poly mesh (примитивы).
// Используется в слотах стола и для overlay на bowl/plate/cup.

import { getItemVisual, type VisualShape } from "@/game/item-visuals";

interface ItemShapeProps {
  itemId: string;
  /** Масштаб относительно базового размера. */
  scale?: number;
  /** Y-смещение базы. */
  yOffset?: number;
}

export function ItemShape({ itemId, scale = 1, yOffset = 0 }: ItemShapeProps) {
  const v = getItemVisual(itemId);
  if (!v) return null;
  return <PrimitiveShape shape={v.shape} color={v.color} scale={scale} yOffset={yOffset} />;
}

function PrimitiveShape({
  shape,
  color,
  scale,
  yOffset,
}: {
  shape: VisualShape;
  color: string;
  scale: number;
  yOffset: number;
}) {
  switch (shape) {
    case "egg":
      return (
        <mesh castShadow position={[0, 0.05 + yOffset, 0]} scale={[scale, scale * 1.3, scale]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      );
    case "leaves":
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
        <group position={[0, 0.015 + yOffset, 0]} scale={scale}>
          <mesh castShadow scale={[1.6, 0.35, 1]}>
            <sphereGeometry args={[0.11, 24, 16]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.025, 0]} scale={[1.45, 0.18, 0.85]}>
            <sphereGeometry args={[0.11, 20, 12]} />
            <meshStandardMaterial color="#d99a3a" roughness={0.65} />
          </mesh>
        </group>
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
