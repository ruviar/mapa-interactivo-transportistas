import { StatsCounter } from './StatsCounter';

interface Props {
  /** Empresas dentro del filtro en toda España: el contador global no se pierde nunca. */
  total: number | null;
}

/**
 * Cabecera: el título y el contador nacional, nada más. Los mandos (filtro de
 * vehículos, orden) viven en el panel de cada listado — aquí arriba le
 * restarían alto al mapa y a la lista en todas las pantallas.
 */
export function Header({ total }: Props) {
  return (
    // Vidrio esmerilado sobre el lienzo: la cabecera flota sin pedir atención.
    <header className="flex shrink-0 items-baseline justify-between gap-3 border-b border-ink/10 bg-base/80 px-4 py-2 backdrop-blur-xl sm:px-5 lg:h-15 lg:items-center lg:py-0">
      <h1 className="truncate text-body-sm font-semibold tracking-tight sm:text-body lg:text-label-lg">
        Transportistas de España
      </h1>

      <StatsCounter ambito="España" total={total} />
    </header>
  );
}
