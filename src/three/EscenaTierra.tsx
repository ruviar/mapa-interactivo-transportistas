import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import type { Group } from 'three';
import * as THREE from 'three';

import cloudsUrl from '../assets/earth/clouds.jpg';
import dayUrl from '../assets/earth/daymap.jpg';
import nightUrl from '../assets/earth/nightmap.jpg';

const VERTEX_MUNDO = `
  varying vec2 vUv;
  varying vec3 vNormalMundo;
  void main() {
    vUv = uv;
    vNormalMundo = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_TIERRA = `
  uniform sampler2D mapaDia;
  uniform sampler2D mapaNoche;
  uniform vec3 direccionSol;
  varying vec2 vUv;
  varying vec3 vNormalMundo;
  void main() {
    float luz = dot(vNormalMundo, normalize(direccionSol));
    float mezcla = smoothstep(-0.15, 0.15, luz);
    vec3 dia = texture2D(mapaDia, vUv).rgb;
    vec3 noche = texture2D(mapaNoche, vUv).rgb;
    gl_FragColor = vec4(mix(noche, dia, mezcla), 1.0);
  }
`;

const VERTEX_ATMOSFERA = `
  varying vec3 vNormalVista;
  void main() {
    vNormalVista = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_ATMOSFERA = `
  varying vec3 vNormalVista;
  void main() {
    float borde = 1.0 - abs(vNormalVista.z);
    float intensidad = pow(borde, 2.2);
    gl_FragColor = vec4(0.35, 0.6, 1.0, intensidad * 0.9);
  }
`;

/**
 * Rotación automática simple, sin scroll: el spike de 7a solo necesita
 * comprobar coste de shader + texturas, no la coreografía de cámara de 7b.
 */
function GrupoTierra() {
  const grupoTierra = useRef<Group>(null);
  const grupoNubes = useRef<Group>(null);
  const mapaDia = useLoader(THREE.TextureLoader, dayUrl);
  const mapaNoche = useLoader(THREE.TextureLoader, nightUrl);
  const mapaNubes = useLoader(THREE.TextureLoader, cloudsUrl);

  useEffect(() => {
    mapaDia.colorSpace = THREE.SRGBColorSpace;
    mapaNoche.colorSpace = THREE.SRGBColorSpace;
  }, [mapaDia, mapaNoche]);

  useFrame((_, delta) => {
    if (grupoTierra.current) grupoTierra.current.rotation.y += delta * 0.045;
    if (grupoNubes.current) grupoNubes.current.rotation.y += delta * 0.06;
  });

  const uniformesTierra = useMemo(
    () => ({
      mapaDia: { value: mapaDia },
      mapaNoche: { value: mapaNoche },
      direccionSol: { value: new THREE.Vector3(5, 2, 5) },
    }),
    [mapaDia, mapaNoche],
  );

  return (
    <>
      <group ref={grupoTierra}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <shaderMaterial
            vertexShader={VERTEX_MUNDO}
            fragmentShader={FRAGMENT_TIERRA}
            uniforms={uniformesTierra}
          />
        </mesh>
      </group>

      <group ref={grupoNubes}>
        <mesh>
          <sphereGeometry args={[1.008, 64, 64]} />
          <meshStandardMaterial
            map={mapaNubes}
            alphaMap={mapaNubes}
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </mesh>
      </group>

      <mesh>
        <sphereGeometry args={[1.02, 64, 64]} />
        <shaderMaterial
          vertexShader={VERTEX_ATMOSFERA}
          fragmentShader={FRAGMENT_ATMOSFERA}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

/** Cuenta fotogramas dentro del loop de R3F; reporta 1 muestra/segundo hacia fuera. */
function MedidorFPS({ onMuestra }: { onMuestra: (fps: number) => void }) {
  const cuadros = useRef(0);
  const ultimo = useRef(0);

  useFrame(() => {
    cuadros.current += 1;
    const ahora = performance.now();
    if (ultimo.current === 0) ultimo.current = ahora;
    const transcurrido = ahora - ultimo.current;
    if (transcurrido >= 1000) {
      onMuestra((cuadros.current * 1000) / transcurrido);
      cuadros.current = 0;
      ultimo.current = ahora;
    }
  });

  return null;
}

export function EscenaTierra() {
  const [fps, setFps] = useState<number | null>(null);
  const historial = useRef<number[]>([]);

  const registrar = useCallback((valor: number) => {
    setFps(valor);
    historial.current.push(valor);
    if (historial.current.length > 120) historial.current.shift();
    const media = historial.current.reduce((a, b) => a + b, 0) / historial.current.length;
    const minimo = Math.min(...historial.current);
    // Log plano y parseable: así una sesión headless (Playwright) puede leer
    // los números sin depender de capturar el HUD en pantalla.
    // eslint-disable-next-line no-console
    console.log(
      `[spike-tierra] fps=${valor.toFixed(1)} media=${media.toFixed(1)} min=${minimo.toFixed(1)} muestras=${historial.current.length}`,
    );
  }, []);

  return (
    <div className="relative h-dvh w-full bg-black">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 2, 5]} intensity={2.2} />
        <Suspense fallback={null}>
          <GrupoTierra />
        </Suspense>
        <MedidorFPS onMuestra={registrar} />
      </Canvas>

      <div
        data-testid="fps-hud"
        className="pointer-events-none absolute left-4 top-4 border border-white/30 bg-black/60 px-3 py-2 font-mono text-body-sm text-white"
      >
        FPS: {fps ? fps.toFixed(1) : '—'}
      </div>
    </div>
  );
}
