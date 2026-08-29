import { useId } from 'react';

import type { Orden } from '../../hooks/useFilteredCompanies';

interface Props {
  orden: Orden;
  onCambiarOrden: (orden: Orden) => void;
}

/** Etiqueta en lenguaje llano: dice el criterio Y el sentido, nunca solo una flecha. */
const OPCIONES: { valor: Orden; etiqueta: string }[] = [
  { valor: 'nombre', etiqueta: 'Empresa (A → Z)' },
  { valor: 'nombre-desc', etiqueta: 'Empresa (Z → A)' },
  { valor: 'localidad', etiqueta: 'Localidad (A → Z)' },
  { valor: 'localidad-desc', etiqueta: 'Localidad (Z → A)' },
  { valor: 'tamano', etiqueta: 'Tamaño (mayor → menor)' },
  { valor: 'tamano-asc', etiqueta: 'Tamaño (menor → mayor)' },
];

/**
 * Selector de orden. Antes eran dos botones con una flecha de significado
 * implícito (¿↑ es A-Z o Z-A? ¿Qué hace ↓ en Localidad?) — un desplegable con
 * el criterio y el sentido escritos en la propia opción no deja nada que
 * adivinar, y admite los tres campos ordenables sin inventar más iconografía.
 */
export function CompanyListHeader({ orden, onCambiarOrden }: Props) {
  const id = useId();

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-asfalto/40 px-4 py-1.5">
      <label htmlFor={id} className="text-caption uppercase tracking-[0.08em] text-asfalto">
        Ordenar
      </label>

      <select
        id={id}
        value={orden}
        onChange={(e) => onCambiarOrden(e.target.value as Orden)}
        className="bg-transparent text-caption font-medium text-ink focus-visible:outline-offset-2"
      >
        {OPCIONES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
