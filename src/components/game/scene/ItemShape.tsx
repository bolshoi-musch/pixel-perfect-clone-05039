// Простая визуализация item id → low-poly mesh / GLTF.
// Используется в слотах стола и для overlay на bowl/plate/cup.

import { getItemVisual, type VisualShape } from "@/game/item-visuals";
import { ModelAsset } from "./ModelAsset";
import { MODEL_ASSETS } from "@/game/model-assets";

interface ItemShapeProps {
  itemId: string;
  /** Масштаб относительно базового размера. */
  scale?: number;
  /** Y-смещение базы. */
  yOffset?: number;
}

// Маппинг id → готовая GLTF-модель.
const ITEM_MODELS: Record<string, { path: string; scale: number; y: number }> = {
  egg: { path: MODEL_ASSETS.food.egg, scale: 0.35, y: 0 },
  egg_premium: { path: MODEL_ASSETS.food.egg, scale: 0.4, y: 0 },
  omelet_cooked: { path: MODEL_ASSETS.food.omelet, scale: 0.4, y: 0 },
  plated_omelet: { path: MODEL_ASSETS.food.omelet, scale: 0.4, y: 0 },
  tea_leaves: { path: MODEL_ASSETS.food.teaLeaves, scale: 0.3, y: 0 },
  bread: { path: MODEL_ASSETS.food.bread, scale: 0.4, y: 0 },
  bread_premium: { path: MODEL_ASSETS.food.bread, scale: 0.45, y: 0 },
};

export function ItemShape({ itemId, scale = 1, yOffset = 0 }: ItemShapeProps) {
  const v = getItemVisual(itemId);
  if (!v) return null;

  // Если есть готовая модель — используем её с fallback на примитив.
  const model = ITEM_MODELS[itemId];
  if (model) {
    return (
      <ModelAsset
        path={model.path}
        scale={model.scale * scale}
        position={[0, model.y + yOffset, 0]}
        fallback={<PrimitiveShape shape={v.shape} color={v.color} scale={scale} yOffset={yOffset} />}
      />
    );
  }

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
