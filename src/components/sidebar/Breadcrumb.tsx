export interface Segmento {
  etiqueta: string;
  /** Sin `onVolver` es el segmento actual: no navega a ningún sitio. */
  onVolver?: () => void;
}

/** `España › Aragón › Zaragoza`. Azul de panel informativo para lo navegable. */
export function Breadcrumb({ segmentos }: { segmentos: Segmento[] }) {
  return (
    <nav aria-label="Ubicación">
      <ol className="flex flex-wrap items-center gap-1.5 text-caption">
        {segmentos.map((segmento, i) => (
          <li key={segmento.etiqueta} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="text-asfalto">
                ›
              </span>
            )}
            {segmento.onVolver ? (
              <button
                type="button"
                onClick={segmento.onVolver}
                className="text-atencion underline-offset-2 hover:underline"
              >
                {segmento.etiqueta}
              </button>
            ) : (
              <span aria-current="page" className="text-asfalto">
                {segmento.etiqueta}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
