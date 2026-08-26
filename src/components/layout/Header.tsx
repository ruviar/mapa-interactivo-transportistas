import type { FiltroFlota } from '../../utils/dataGrouping';
import { EmployeeThresholdSlider } from './EmployeeThresholdSlider';
import { FleetSourceFilter } from './FleetSourceFilter';
import { StatsCounter } from './StatsCounter';

interface Props {
  /** Empresas que cumplen el filtro en toda España: el contador global no se pierde nunca. */
  total: number | null;
  umbral: number;
  fuente: FiltroFlota;
  /**
   * ¿Hay flotas verificadas en el REAT en el dataset? Mientras no las haya
   * —hoy `meta.resumen.verificada` es 0— el filtro de fuente no se enseña:
   * un mando cuya única opción distinta deja el mapa a cero parece una avería,
   * no un filtro. Aparecerá solo cuando el dato exista.
   */
  hayVerificadas: boolean;
  onCambiarUmbral: (umbral: number) => void;
  onCambiarFuente: (fuente: FiltroFlota) => void;
}

/**
 * Cabecera. En escritorio los bloques van en una fila de 60 px; en móvil los
 * dos mandos —fuente y umbral— bajan cada uno a su propia línea a todo el
 * ancho: un slider de 110 px con el pulgar del dedo encima no es un control,
 * es una lotería.
 */
export function Header({
  total,
  umbral,
  fuente,
  hayVerificadas,
  onCambiarUmbral,
  onCambiarFuente,
}: Props) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-asfalto/40 bg-base px-4 py-2 sm:px-5 lg:h-15 lg:flex-nowrap lg:py-0">
      {/* `lg:contents` deshace el envoltorio en escritorio: allí la fila la
          reparte la propia cabecera y este div solo estorbaría. */}
      <div className="flex w-full min-w-0 items-baseline justify-between gap-3 lg:contents">
        <h1 className="rotulo truncate text-body-sm sm:text-body lg:text-label-lg">
          Transportistas de España
        </h1>

        <StatsCounter ambito="España" total={total} />
      </div>

      {hayVerificadas && <FleetSourceFilter fuente={fuente} onCambiar={onCambiarFuente} />}

      <EmployeeThresholdSlider umbral={umbral} onCambiar={onCambiarUmbral} />
    </header>
  );
}
