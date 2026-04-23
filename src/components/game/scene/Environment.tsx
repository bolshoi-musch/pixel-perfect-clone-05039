// Окружение кухни: пол, задние стены, рабочая поверхность стола.

import { SCENE_COLORS } from "./colors";

export function Environment() {
  return (
    <group>
      {/* Пол */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={SCENE_COLORS.floor} roughness={0.95} />
      </mesh>

      {/* Задняя стена */}
      <mesh position={[0, 1.4, -3]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color={SCENE_COLORS.wallBack} roughness={1} />
      </mesh>

      {/* Боковые стены */}
      <mesh position={[-5, 1.4, -1]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={SCENE_COLORS.wallSide} roughness={1} />
      </mesh>
      <mesh position={[5, 1.4, -1]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={SCENE_COLORS.wallSide} roughness={1} />
      </mesh>

      {/* Полка над столом */}
      <mesh position={[0, 2.2, -2.6]} castShadow>
        <boxGeometry args={[5, 0.08, 0.6]} />
        <meshStandardMaterial color={SCENE_COLORS.woodDark} roughness={0.7} />
      </mesh>
    </group>
  );
}
