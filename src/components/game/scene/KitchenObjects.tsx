// Объекты кухни: плита, миска, тарелка, чашка, звонок. Все интерактивные.

import { ThreeEvent } from "@react-three/fiber";
import { useState } from "react";
import { SCENE_COLORS } from "./colors";

interface ClickableProps {
  position: [number, number, number];
  onClick: (worldPos: [number, number, number]) => void;
  onHover?: (label: string | null) => void;
  label: string;
  children: React.ReactNode;
}

function Clickable({ position, onClick, onHover, label, children }: ClickableProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        onHover?.(label);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(false);
        onHover?.(null);
        document.body.style.cursor = "default";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick([position[0], position[1], position[2]]);
      }}
      scale={hovered ? 1.04 : 1}
    >
      {children}
      {hovered && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.001, 4, 4]} />
          <meshBasicMaterial color={SCENE_COLORS.highlight} />
        </mesh>
      )}
    </group>
  );
}

export function Stove({ onClick, onHover }: { onClick: ClickableProps["onClick"]; onHover?: ClickableProps["onHover"] }) {
  return (
    <Clickable position={[-1.7, 0.2, -0.4]} onClick={onClick} onHover={onHover} label="Плита">
      {/* Корпус */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.4, 0.7]} />
        <meshStandardMaterial color={SCENE_COLORS.steel} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Конфорка */}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.steelDark} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <torusGeometry args={[0.18, 0.015, 8, 24]} />
        <meshStandardMaterial color="#3a1a1a" emissive="#c44536" emissiveIntensity={0.4} />
      </mesh>
    </Clickable>
  );
}

export function Bowl({ onClick, onHover }: { onClick: ClickableProps["onClick"]; onHover?: ClickableProps["onHover"] }) {
  return (
    <Clickable position={[-0.7, 0.06, -0.35]} onClick={onClick} onHover={onHover} label="Миска">
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.14, 0.16, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.17, 0.12, 0.1, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.woodDark} roughness={0.6} />
      </mesh>
    </Clickable>
  );
}

export function Plate({ onClick, onHover }: { onClick: ClickableProps["onClick"]; onHover?: ClickableProps["onHover"] }) {
  return (
    <Clickable position={[0.5, 0.06, -0.35]} onClick={onClick} onHover={onHover} label="Тарелка">
      <mesh castShadow rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.22, 0.04, 28]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.35} />
      </mesh>
    </Clickable>
  );
}

export function Cup({ onClick, onHover }: { onClick: ClickableProps["onClick"]; onHover?: ClickableProps["onHover"] }) {
  return (
    <Clickable position={[1.3, 0.1, -0.35]} onClick={onClick} onHover={onHover} label="Чашка">
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.085, 0.16, 20]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.4} />
      </mesh>
      {/* Ручка */}
      <mesh position={[0.13, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.014, 8, 16]} />
        <meshStandardMaterial color={SCENE_COLORS.ceramic} roughness={0.4} />
      </mesh>
    </Clickable>
  );
}

export function Bell({ onClick, onHover }: { onClick: ClickableProps["onClick"]; onHover?: ClickableProps["onHover"] }) {
  return (
    <Clickable position={[1.85, 0.08, 0.35]} onClick={onClick} onHover={onHover} label="Звонок гостя">
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.025, 24]} />
        <meshStandardMaterial color={SCENE_COLORS.bellBase} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.085, 0]}>
        <sphereGeometry args={[0.1, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={SCENE_COLORS.bell} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color={SCENE_COLORS.bell} metalness={0.7} />
      </mesh>
    </Clickable>
  );
}

// Visual marker «рабочей зоны» (work_surface) — мягкий контур на столе
export function WorkSurfaceMarker({
  onClick,
  onHover,
  position,
}: {
  position: [number, number, number];
  onClick: ClickableProps["onClick"];
  onHover?: ClickableProps["onHover"];
}) {
  return (
    <Clickable position={position} onClick={onClick} onHover={onHover} label="Рабочая зона">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[0.22, 0.27, 32]} />
        <meshBasicMaterial color={SCENE_COLORS.copper} transparent opacity={0.5} />
      </mesh>
    </Clickable>
  );
}
