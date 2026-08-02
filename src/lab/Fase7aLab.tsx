import { EscenaTierra } from '../three/EscenaTierra';

/**
 * Spike técnico de la Fase 7a: solo mide si una Tierra 3D básica (día/noche,
 * nubes, rotación automática) aguanta en FPS antes de construir la
 * coreografía de scroll de la 7b encima. Sin scroll, sin cámara animada.
 */
export function Fase7aLab() {
  return <EscenaTierra />;
}
