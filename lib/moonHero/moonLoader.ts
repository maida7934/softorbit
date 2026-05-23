import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadMoon(
  scene:   THREE.Scene,
  onReady: (moon: THREE.Group, nativeRadius: number) => void,
  onError: (err: unknown) => void
): void {
  const loader = new GLTFLoader();

  loader.load(
    '/scene.gltf',
    (gltf) => {
      const moon = gltf.scene;

      // Add to scene so all child world transforms resolve
      scene.add(moon);

      // Get bounding box at native scale (no normalisation yet)
      const box    = new THREE.Box3().setFromObject(moon);
      const centre = box.getCenter(new THREE.Vector3());
      const size   = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      console.log('[MoonLoader] native centre x:', centre.x.toFixed(4), 'y:', centre.y.toFixed(4), 'z:', centre.z.toFixed(4));
      console.log('[MoonLoader] native size x:', size.x.toFixed(4), 'y:', size.y.toFixed(4), 'z:', size.z.toFixed(4));
      console.log('[MoonLoader] native maxDim:', maxDim.toFixed(4));

      if (maxDim === 0) {
        onError(new Error('GLTF geometry empty — check .bin path'));
        return;
      }

      // Centre the group at origin using native coordinates
      moon.position.set(-centre.x, -centre.y, -centre.z);

      // Do NOT normalise scale here.
      // Pass the native half-extent to MoonController so it can
      // compute the correct scale to fill a target % of screen.
      const nativeRadius = maxDim / 2;
      moon.userData.nativeRadius = nativeRadius;

      // Fix texture colour space
      moon.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.map)         mat.map.colorSpace         = THREE.SRGBColorSpace;
          if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
          if (mat.normalMap)   mat.normalMap.colorSpace   = THREE.LinearSRGBColorSpace;
        }
      });

      onReady(moon, nativeRadius);
    },
    undefined,
    onError
  );
}
