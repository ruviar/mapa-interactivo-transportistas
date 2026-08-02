import { etiquetasCortes, type CortesCoropleta } from '../../utils/choroplethScale';

/** Literales para que Tailwind los encuentre al escanear el fichero. */
const FONDO_PASO = [
  'bg-mapa-0',
  'bg-mapa-1',
  'bg-mapa-2',
  'bg-mapa-3',
  'bg-mapa-4',
  'bg-mapa-5',
] as const;

interface Props {
  cortes: CortesCoropleta;
  /** Qué se está coloreando ahora mismo: comunidades o provincias. */
  ambito: string;
  /** Sin datos aún: se enseña la escala en gris, sin rangos inventados. */
  activa: boolean;
  /**
   * Variante para el asomo de la hoja inferior: rótulo encima y escala a todo
   * el ancho. En una pantalla de 390 px la fila del pie se parte en dos y los
   * rangos dejan de leerse como una escala continua.
   */
  compacta?: boolean;
}

export function MapLegend({ cortes, ambito, activa, compacta = false }: Props) {
  const etiquetas = etiquetasCortes(cortes);

  return (
    <div className={compacta ? 'flex flex-col gap-1' : 'flex items-center gap-3'}>
      <span className="text-caption text-asfalto">Empresas por {ambito}</span>
      <ul className={`flex items-stretch ${compacta ? 'w-full' : ''}`}>
        {FONDO_PASO.map((fondo, i) => (
          <li key={fondo} className={`flex flex-col gap-1 ${compacta ? 'min-w-0 flex-1' : ''}`}>
            <span
              className={`block h-2.5 border-r border-base ${compacta ? 'w-full' : 'w-12'} ${
                activa ? fondo : 'bg-asfalto/25'
              }`}
            />
            <span className="text-center font-mono text-[0.625rem] tabular-nums text-asfalto">
              {activa ? etiquetas[i] : '·'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
