import { MapLegend } from '../map/MapLegend';
import type { CortesCoropleta } from '../../utils/choroplethScale';

interface Props {
  cortes: CortesCoropleta;
  ambito: string;
  activa: boolean;
}

/**
 * Pie de la columna del mapa, solo escritorio: la leyenda de la coropleta,
 * nada más. Vive DENTRO de la columna del mapa (ver `App.tsx`) y no a lo ancho
 * de la ventana: termina donde termina el mapa y el panel de consulta llega
 * hasta abajo sin nada debajo. En móvil la leyenda va en el asomo de la hoja.
 *
 * Las atribuciones cartográficas ya no van aquí: viven en el control de
 * atribución del propio mapa (ver `SpainMap`).
 */
export function Footer({ cortes, ambito, activa }: Props) {
  return (
    <footer className="hidden shrink-0 items-center border-t border-ink/10 bg-base px-5 py-2.5 lg:flex">
      <MapLegend cortes={cortes} ambito={ambito} activa={activa} />
    </footer>
  );
}
