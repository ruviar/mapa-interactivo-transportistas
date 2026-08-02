import { EmployeeThresholdSlider } from './EmployeeThresholdSlider';
import { StatsCounter } from './StatsCounter';

interface Props {
  /** Empresas que cumplen el filtro en toda España: el contador global no se pierde nunca. */
  total: number | null;
  umbral: number;
  onCambiarUmbral: (umbral: number) => void;
}

/**
 * Cabecera. En escritorio los tres bloques van en una fila de 60 px; en móvil
 * el umbral baja a su propia línea a todo el ancho —un slider de 110 px con el
 * pulgar del dedo encima no es un control, es una lotería.
 */
export function Header({ total, umbral, onCambiarUmbral }: Props) {
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

      <EmployeeThresholdSlider umbral={umbral} onCambiar={onCambiarUmbral} />
    </header>
  );
}
