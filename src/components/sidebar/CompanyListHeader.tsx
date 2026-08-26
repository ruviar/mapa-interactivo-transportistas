import type { Orden } from '../../hooks/useFilteredCompanies';

interface Props {
  orden: Orden;
  onCambiarOrden: (orden: Orden) => void;
}

/**
 * Cabecera del listado: nombra las columnas y sirve para ordenar por ellas.
 *
 * Son botones con `aria-pressed` y no cabeceras de tabla: el listado es una
 * lista virtualizada, no un `<table>`, y fingir semántica de tabla para tres
 * columnas confundiría a un lector de pantalla más de lo que ayuda.
 *
 * Cada columna arranca en su sentido natural —alfabético ascendente, tamaño
 * descendente— y volver a pulsar la activa lo invierte. La flecha dice el
 * sentido vigente y reserva sitio también inactiva para que la etiqueta no
 * baile al activarse.
 */
export function CompanyListHeader({ orden, onCambiarOrden }: Props) {
  return (
    <div
      role="group"
      aria-label="Ordenar el listado"
      className="flex shrink-0 items-center justify-between gap-3 border-b border-asfalto/40 px-4 py-1.5"
    >
      <div className="flex items-center gap-4">
        <Columna
          orden={orden}
          ascendente="nombre"
          descendente="nombre-desc"
          defecto="nombre"
          onCambiarOrden={onCambiarOrden}
          titulo="Ordenar por nombre de empresa; pulsar de nuevo invierte el sentido"
        >
          Empresa
        </Columna>

        <Columna
          orden={orden}
          ascendente="localidad"
          descendente="localidad-desc"
          defecto="localidad"
          onCambiarOrden={onCambiarOrden}
          titulo="Ordenar por localidad; pulsar de nuevo invierte el sentido"
        >
          Localidad
        </Columna>
      </div>

      <Columna
        orden={orden}
        ascendente="tamano-asc"
        descendente="tamano"
        defecto="tamano"
        onCambiarOrden={onCambiarOrden}
        titulo="Ordenar por tamaño: empleados en SABI, o vehículos si la flota está verificada en el REAT. Pulsar de nuevo invierte el sentido."
      >
        Tamaño
      </Columna>
    </div>
  );
}

function Columna({
  orden,
  ascendente,
  descendente,
  defecto,
  onCambiarOrden,
  titulo,
  children,
}: {
  orden: Orden;
  ascendente: Orden;
  descendente: Orden;
  /** Sentido con el que arranca la columna al activarse: el que responde a la pregunta habitual. */
  defecto: Orden;
  onCambiarOrden: (orden: Orden) => void;
  titulo: string;
  children: string;
}) {
  const activa = orden === ascendente || orden === descendente;
  const siguiente = activa ? (orden === ascendente ? descendente : ascendente) : defecto;

  return (
    <button
      type="button"
      onClick={() => onCambiarOrden(siguiente)}
      aria-pressed={activa}
      title={titulo}
      className={`flex items-center gap-1 text-caption transition-colors duration-150 ${
        activa ? 'font-medium text-ink' : 'text-asfalto hover:text-ink'
      }`}
    >
      {children}
      {/* El sentido, audible: la flecha va `aria-hidden` y `aria-pressed` solo
          dice que la columna está activa, no hacia dónde ordena. */}
      {activa && (
        <span className="sr-only">
          {orden === ascendente ? ', orden ascendente' : ', orden descendente'}
        </span>
      )}
      {/* Reservada siempre: si apareciera al activarse, movería la etiqueta. */}
      <span aria-hidden="true" className={activa ? 'text-atencion' : 'invisible'}>
        {activa && orden === ascendente ? '↑' : '↓'}
      </span>
    </button>
  );
}
