import { useId } from 'react';

import type { Orden } from '../../hooks/useFilteredCompanies';
import {
  SENTIDO_POR_DEFECTO,
  type ClaveOrden,
  type CriterioOrden,
  type SentidoOrden,
} from '../../utils/ordenacion';

interface Props {
  orden: Orden;
  onCambiarOrden: (orden: Orden) => void;
}

const CRITERIOS: { valor: CriterioOrden; etiqueta: string }[] = [
  { valor: 'nombre', etiqueta: 'Empresa' },
  { valor: 'localidad', etiqueta: 'Localidad' },
  { valor: 'tamano', etiqueta: 'Tamaño' },
];

/** El sentido se dice en el idioma del criterio: letras con letras, cifras con cifras. */
const SENTIDOS: Record<CriterioOrden, Record<SentidoOrden, string>> = {
  nombre: { asc: 'A → Z', desc: 'Z → A' },
  localidad: { asc: 'A → Z', desc: 'Z → A' },
  tamano: { asc: 'Menor → mayor', desc: 'Mayor → menor' },
};

/**
 * Orden en dos niveles, cada pieza en su desplegable: criterio y sentido por
 * separado, más un "luego por" opcional que desempata. Antes criterio y
 * sentido iban soldados en una sola lista de seis opciones y solo podía haber
 * un criterio — "Localidad A→Z con las grandes arriba de cada pueblo" era
 * impedible. Ahora cualquier combinación de dos criterios es un par de clics.
 */
export function CompanyListHeader({ orden, onCambiarOrden }: Props) {
  const idCriterio = useId();
  const idLuego = useId();

  const principal: ClaveOrden = orden[0] ?? { criterio: 'nombre', sentido: 'asc' };
  const secundaria: ClaveOrden | null = orden[1] ?? null;

  const cambiarPrincipal = (clave: ClaveOrden) => {
    // Si el desempate repite el criterio nuevo, sobra: ya no desempata nada.
    const resto = secundaria && secundaria.criterio !== clave.criterio ? [secundaria] : [];
    onCambiarOrden([clave, ...resto]);
  };

  const cambiarSecundaria = (clave: ClaveOrden | null) =>
    onCambiarOrden(clave ? [principal, clave] : [principal]);

  return (
    <div className="flex flex-col gap-2">
      <FilaOrden
        id={idCriterio}
        etiqueta="Ordenar por"
        clave={principal}
        criterios={CRITERIOS}
        onCambiar={(c) => cambiarPrincipal(c!)}
      />

      <FilaOrden
        id={idLuego}
        etiqueta="Luego por"
        clave={secundaria}
        criterios={CRITERIOS.filter((c) => c.valor !== principal.criterio)}
        opcional
        onCambiar={cambiarSecundaria}
      />
    </div>
  );
}

function FilaOrden({
  id,
  etiqueta,
  clave,
  criterios,
  opcional = false,
  onCambiar,
}: {
  id: string;
  etiqueta: string;
  clave: ClaveOrden | null;
  criterios: { valor: CriterioOrden; etiqueta: string }[];
  /** Con `opcional`, el desplegable ofrece "—" y la clave puede ser `null`. */
  opcional?: boolean;
  onCambiar: (clave: ClaveOrden | null) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-body-sm">
      <label htmlFor={id} className="shrink-0 text-caption uppercase tracking-[0.08em] text-asfalto">
        {etiqueta}
      </label>

      <span className="flex min-w-0 items-center gap-1.5">
        <select
          id={id}
          value={clave?.criterio ?? ''}
          onChange={(e) => {
            const criterio = e.target.value as CriterioOrden | '';
            onCambiar(
              criterio === '' ? null : { criterio, sentido: SENTIDO_POR_DEFECTO[criterio] },
            );
          }}
          className="min-w-0 bg-transparent text-caption font-medium text-ink"
        >
          {opcional && <option value="">—</option>}
          {criterios.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </select>

        {clave && (
          <select
            aria-label={`Sentido del orden por ${criterios.find((c) => c.valor === clave.criterio)?.etiqueta ?? clave.criterio}`}
            value={clave.sentido}
            onChange={(e) => onCambiar({ ...clave, sentido: e.target.value as SentidoOrden })}
            className="min-w-0 bg-transparent text-caption font-medium text-ink"
          >
            <option value="asc">{SENTIDOS[clave.criterio].asc}</option>
            <option value="desc">{SENTIDOS[clave.criterio].desc}</option>
          </select>
        )}
      </span>
    </div>
  );
}
