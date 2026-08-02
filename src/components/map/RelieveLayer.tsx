import { ImageOverlay } from 'react-leaflet';

import canariasWebp from '../../assets/relieve/canarias.webp';
import peninsulaWebp from '../../assets/relieve/peninsula-baleares.webp';
import type { Limites } from '../../utils/cartografia';

const PENINSULA_BOUNDS: Limites = [
  [34.86546, -9.6993],
  [44.18727, 4.72779],
];

/**
 * La imagen se generó con el DEM real de Canarias (para que el relieve sea
 * correcto), pero el GeoJSON dibuja las islas trasladadas a esta cartela, no
 * en su posición geográfica real -- hay que anclar aquí, no en el bbox real.
 */
const CANARIAS_BOUNDS: Limites = [
  [34.8, -13.5],
  [37.45123, -7.75919],
];

/**
 * Hillshade estático (Bloque B, Fase 7): una sola imagen por territorio,
 * generada una vez en build time a partir de Copernicus DEM GLO-90
 * (`scripts/generar_hillshade.py`), no un terreno navegable ni teselas de
 * elevación bajo demanda. Va bajo la coropleta (mismo pane, insertada antes
 * en el árbol) con `multiply` para que tiña sin competir con los colores de
 * los datos.
 */
export function RelieveLayer() {
  return (
    <>
      <ImageOverlay
        url={peninsulaWebp}
        bounds={PENINSULA_BOUNDS}
        className="capa-relieve"
        interactive={false}
      />
      <ImageOverlay
        url={canariasWebp}
        bounds={CANARIAS_BOUNDS}
        className="capa-relieve"
        interactive={false}
      />
    </>
  );
}
