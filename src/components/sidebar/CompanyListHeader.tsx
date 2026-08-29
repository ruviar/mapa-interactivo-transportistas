import { useId } from 'react';

import type { Orden } from '../../hooks/useFilteredCompanies';
import type { ClaveOrden } from '../../utils/ordenacion';

interface Props {
  orden: Orden;
  onCambiarOrden: (orden: Orden) => void;
}

/** Cada opción codifica criterio y sentido; '' es "sin aplicar". */
const OPCIONES_ALFABETICO: { valor: string; etiqueta: string }[] = [
  { valor: '', etiqueta: '—' },
  { valor: 'nombre:asc', etiqueta: 'Empresa (A → Z)' },
  { valor: 'nombre:desc', etiqueta: 'Empresa (Z → A)' },
  { valor: 'localidad:asc', etiqueta: 'Localidad (A → Z)' },
  { valor: 'localidad:desc', etiqueta: 'Localidad (Z → A)' },
];

const OPCIONES_TAMANO: { valor: string; etiqueta: string }[] = [
  { valor: '', etiqueta: '—' },
  { valor: 'tamano:desc', etiqueta: 'Mayor → menor' },
  { valor: 'tamano:asc', etiqueta: 'Menor → mayor' },
];

function aClave(valor: string): ClaveOrden | null {
  if (valor === '') return null;
  const [criterio, sentido] = valor.split(':') as [ClaveOrden['criterio'], ClaveOrden['sentido']];
  return { criterio, sentido };
}

const deClave = (clave: ClaveOrden | null) =>
  clave ? `${clave.criterio}:${clave.sentido}` : '';

/**
 * Dos mandos de orden, uno por familia: el alfabético (empresa o localidad) y
 * el de tamaño. Se combinan solos: el alfabético manda y el tamaño desempata
 * dentro de cada grupo — "Localidad A→Z" + "Mayor→menor" pone cada pueblo en
 * orden con sus grandes arriba. Con el alfabético en "—", el tamaño manda él
 * solo. Y con los dos en "—", el listado cae al alfabético por nombre (el
 * comparador lo trae de serie como desempate final).
 */
export function CompanyListHeader({ orden, onCambiarOrden }: Props) {
  const idAlfabetico = useId();
  const idTamano = useId();

  const alfabetico = orden.find((c) => c.criterio !== 'tamano') ?? null;
  const tamano = orden.find((c) => c.criterio === 'tamano') ?? null;

  const emitir = (alf: ClaveOrden | null, tam: ClaveOrden | null) =>
    onCambiarOrden([alf, tam].filter((c): c is ClaveOrden => c !== null));

  return (
    <div className="flex flex-col gap-2">
      <FilaOrden
        id={idAlfabetico}
        etiqueta="Alfabético"
        valor={deClave(alfabetico)}
        opciones={OPCIONES_ALFABETICO}
        onCambiar={(v) => emitir(aClave(v), tamano)}
      />

      <FilaOrden
        id={idTamano}
        etiqueta="Tamaño"
        valor={deClave(tamano)}
        opciones={OPCIONES_TAMANO}
        onCambiar={(v) => emitir(alfabetico, aClave(v))}
      />
    </div>
  );
}

function FilaOrden({
  id,
  etiqueta,
  valor,
  opciones,
  onCambiar,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  opciones: { valor: string; etiqueta: string }[];
  onCambiar: (valor: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-body-sm">
      <label htmlFor={id} className="shrink-0 text-caption uppercase tracking-[0.08em] text-asfalto">
        {etiqueta}
      </label>

      <select
        id={id}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        className="min-w-0 bg-transparent text-caption font-medium text-ink"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
