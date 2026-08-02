const nf = new Intl.NumberFormat('es-ES');

interface Props {
  /** Ámbito del recuento: "España" hoy, la región activa a partir de la Fase 3. */
  ambito: string;
  total: number | null;
}

/**
 * Contador siempre visible. La cifra en monoespaciada, como todo dato de tabla.
 *
 * En móvil el ámbito se lee pero no se ve: en 390 px compite con el título por
 * la misma línea, y el título ya dice "de España". Va con `sr-only` y no
 * `hidden` para que quien navega con lector de pantalla no pierda de qué
 * territorio es la cifra.
 */
export function StatsCounter({ ambito, total }: Props) {
  return (
    <p className="flex shrink-0 items-baseline gap-2" aria-live="polite">
      <span className="text-body-sm text-asfalto max-sm:sr-only">{ambito}</span>
      <span aria-hidden="true" className="text-asfalto/60 max-sm:hidden">
        ·
      </span>
      <span className="font-mono text-body font-medium tabular-nums lg:text-label-lg">
        {total === null ? '—' : nf.format(total)}
      </span>
      <span className="text-body-sm text-asfalto">empresas</span>
    </p>
  );
}
