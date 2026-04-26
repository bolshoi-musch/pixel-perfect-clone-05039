// Компонент-обёртка над useGLTF из drei с graceful-fallback.
// Используется внутри существующих <Clickable> wrappers — НЕ перехватывает события.

import { Suspense, Component, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";

interface ModelAssetProps {
  /** Public path, e.g. "/assets/models/kitchen/bowl.glb". */
  path: string;
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  position?: [number, number, number];
  /** Fallback primitive если модель не загрузилась. */
  fallback: ReactNode;
}

function GLTFInner({
  path,
  scale = 1,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
}: Omit<ModelAssetProps, "fallback">) {
  // useGLTF бросает Suspense promise; ошибки ловит ErrorBoundary.
  const gltf = useGLTF(path);
  // Клонируем сцену, чтобы один и тот же gltf можно было использовать многократно.
  const scene = gltf.scene.clone(true);
  // Убедимся, что mesh внутри отбрасывают тени.
  scene.traverse((obj) => {
    const m = obj as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return <primitive object={scene} scale={scale} rotation={rotation} position={position} />;
}

class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // Тихо логируем, не валим игру.
    console.warn("[ModelAsset] failed to load model:", error);
  }
  render() {
    if (this.state.hasError) return <>{this.props.fallback}</>;
    return <>{this.props.children}</>;
  }
}

export function ModelAsset({ path, scale, rotation, position, fallback }: ModelAssetProps) {
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={<>{fallback}</>}>
        <GLTFInner path={path} scale={scale} rotation={rotation} position={position} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

// Пред-загрузка ключевых моделей (не критична — Suspense справится сам).
try {
  useGLTF.preload("/assets/models/kitchen/bowl.glb");
  useGLTF.preload("/assets/models/kitchen/plate.glb");
  useGLTF.preload("/assets/models/kitchen/cup.glb");
  useGLTF.preload("/assets/models/kitchen/cup_tea.glb");
  useGLTF.preload("/assets/models/kitchen/kettle_proxy_pot.glb");
  useGLTF.preload("/assets/models/kitchen/stove.gltf");
  useGLTF.preload("/assets/models/food/egg.glb");
  useGLTF.preload("/assets/models/food/omelet_proxy_pancakes.glb");
  useGLTF.preload("/assets/models/food/tea_leaves_proxy.gltf");
} catch {
  // ignore preload errors
}
