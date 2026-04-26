// Auto-curated candidate assets from KayKit Restaurant Bits + Kenney Food Kit.
// Put these files under /public/assets/models and use the paths as public URLs in Vite.

export const MODEL_ASSETS = {
  kitchen: {
    stove: "/assets/models/kitchen/stove.gltf",
    stoveSingle: "/assets/models/kitchen/stove_single.gltf",
    oven: "/assets/models/kitchen/oven.gltf",
    bowl: "/assets/models/kitchen/bowl.glb",
    plate: "/assets/models/kitchen/plate.glb",
    cup: "/assets/models/kitchen/cup.glb",
    cupTea: "/assets/models/kitchen/cup_tea.glb",
    mug: "/assets/models/kitchen/mug.glb",
    kettle: "/assets/models/kitchen/kettle_proxy_pot.glb", // no true kettle in these packs; use pot for now
    kettleAlt: "/assets/models/kitchen/kettle_proxy_steamer.glb",
    fryingPan: "/assets/models/kitchen/frying_pan.glb",
    pan: "/assets/models/kitchen/pan.glb",
  },
  food: {
    egg: "/assets/models/food/egg.glb",
    friedEgg: "/assets/models/food/fried_egg.glb",
    omelet: "/assets/models/food/omelet_proxy_pancakes.glb", // better than current primitive; replace later if you find real omelet
    bread: "/assets/models/food/bread.glb",
    toast: "/assets/models/food/toast_proxy_bread.glb",
    teaCup: "/assets/models/food/tea_cup.glb",
    teaLeaves: "/assets/models/food/tea_leaves_proxy.gltf",
    cheeseSlice: "/assets/models/food/cheese_slice.gltf",
    tomatoSlice: "/assets/models/food/tomato_slice.gltf",
  },
  scene: {
    tableLarge: "/assets/models/scene/table_large.gltf",
    counter: "/assets/models/scene/counter_straight.gltf",
    counterDecorated: "/assets/models/scene/counter_decorated.gltf",
    floorKitchen: "/assets/models/scene/floor_kitchen.gltf",
    wallDecorated: "/assets/models/scene/wall_decorated.gltf",
  },
} as const;
