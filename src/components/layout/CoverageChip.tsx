import { cobertura, type Conteo } from '../../utils/dataGrouping';

const nf = new Intl.NumberFormat('es-ES');
const pf = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });

interface Props {
  conteo: Conteo | null;
  /** Región a la que se refiere el dato ("España", "Zaragoza"…). */
  ambito: string;
}

/**
 * Cobertura de dato de la región activa. Va deliberadamente separada del
 * contador del filtro y en navy, no en el ámbar de atención: el ámbar mide
 * transportistas (coropleta, filtro), esto mide de cuántos sabemos el tamaño.
 * Mezclar las dos cifras haría leer "1.899" como "los transportistas que hay".
 *
 * El denominador es provisional — activas del export de SABI — hasta que entre
 * la capa de INE DIRCE con el total oficial por provincia y CNAE.
 */
export function CoverageChip({ conteo, ambito }: Props) {
  const ratio = conteo ? cobertura(conteo) : null;

  return (
    <div
      className="mt-2.5"
      title={
        `Empresas activas de ${ambito} con tamaño de plantilla o flota registrado y vigente. ` +
        'Denominador provisional: el propio export de SABI puede estar incompleto. ' +
        'Solo estas empresas pueden entrar en el filtro por tamaño.'
      }
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-caption uppercase tracking-[0.08em] text-asfalto">
          Cobertura de dato
        </span>
        <span className="font-mono text-caption tabular-nums text-asfalto">
          {ratio === null ? '—' : pf.format(ratio)}
        </span>
      </div>

      <div className="mt-1 h-0.5 w-full bg-asfalto/25" aria-hidden="true">
        <div
          className="h-full bg-navy-800 transition-[width] duration-200"
          style={{ width: ratio === null ? '0%' : `${Math.max(ratio * 100, 0.5)}%` }}
        />
      </div>

      <p className="mt-1 text-caption leading-snug text-asfalto">
        {conteo === null
          ? 'Calculando…'
          : conteo.activas === 0
            ? 'Sin empresas activas en el registro.'
            : `${nf.format(conteo.conDato)} de ${nf.format(conteo.activas)} activas tienen tamaño registrado.`}
      </p>
    </div>
  );
}
