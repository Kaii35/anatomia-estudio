import { Suspense, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Box3, Group, Vector3 } from 'three';

/** Giro automático: 22 grados por segundo, como en la presentación original. */
const GIRO = (22 * Math.PI) / 180;

function Escena({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Se copia la escena para no compartir el objeto cacheado y se centra y escala para que quepa en la lámina.
  const modelo = useMemo(() => scene.clone(true), [scene]);
  const grupo = useMemo(() => new Group(), []);

  useLayoutEffect(() => {
    const caja = new Box3().setFromObject(modelo);
    const centro = caja.getCenter(new Vector3());
    const tamano = caja.getSize(new Vector3());
    const escala = 3.2 / Math.max(tamano.x, tamano.y, tamano.z || 1);
    modelo.position.sub(centro);
    grupo.scale.setScalar(escala);
    grupo.add(modelo);
    return () => {
      grupo.remove(modelo);
    };
  }, [modelo, grupo]);

  useFrame((_, delta) => {
    grupo.rotation.y += GIRO * delta;
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} />
      <primitive object={grupo} />
      <OrbitControls makeDefault enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} />
    </>
  );
}

/**
 * Modelo 3D de una lámina. Solo existe mientras la lámina está activa o junto a la activa:
 * así hay como mucho tres escenas a la vez y el navegador no se ahoga con contextos WebGL.
 */
export default function Modelo3D({ url }: { url: string }) {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <Escena url={url} />
      </Suspense>
    </Canvas>
  );
}
