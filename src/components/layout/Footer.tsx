import { MapLegend } from '../map/MapLegend';
import type { CortesCoropleta } from '../../utils/choroplethScale';
import { NotaDatos } from './NotaDatos';

interface Props {
  cortes: CortesCoropleta;
  ambito: string;
  activa: boolean;
}

/**
 * Pie de escritorio. En móvil y tablet no existe: la pantalla se reparte entre
 * mapa y hoja inferior, y sus dos contenidos se mudan dentro de la hoja —la
 * leyenda al asomo (siempre visible bajo el mapa, como aquí) y la nota al
 * bloque de metadatos.
 */
export function Footer({ cortes, ambito, activa }: Props) {
  return (
    <footer className="hidden shrink-0 flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-ink/10 bg-base px-5 py-2.5 lg:flex">
      <MapLegend cortes={cortes} ambito={ambito} activa={activa} />
      <NotaDatos className="max-w-prose" />
    </footer>
  );
}
