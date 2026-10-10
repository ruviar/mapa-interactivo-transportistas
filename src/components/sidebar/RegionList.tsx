import { useLayoutEffect, useRef } from 'react';

import { useMenosMovimiento } from '../../animation/fisica';
import { Flip } from '../../animation/gsap';

const nf = new Intl.NumberFormat('es-ES');

export interface FilaRegion {
  cod: string;
  nombre: string;
  cumplen: number;
}

/**
 * Las mismas regiones que el mapa, en lista ordenada por nº de empresas.
 * Existe por dos motivos: el panel no se queda vacío mientras no hay provincia
 * elegida, y toda la navegación es alcanzable con el teclado sin depender de
 * poder pulsar un polígono.
 *
 * Al mover el filtro de vehículos el orden cambia (más regiones cumplen, otras dejan de
 * hacerlo) y las filas se reordenan con GSAP Flip en vez de saltar. Esto va
 * aquí y no en `CompanyList`: aquella es una lista virtualizada de
 * `react-window` que puede traer miles de filas, y Flip necesita elementos
 * DOM estables para medir — con filas recicladas por el propio
 * virtualizador no hay "antes" y "después" que comparar. Como mucho 52
 * regiones, sin virtualizar: aquí sí tiene sentido.
 */
export function RegionList({
  regiones,
  onSeleccionar,
}: {
  regiones: FilaRegion[];
  onSeleccionar: (cod: string) => void;
}) {
  const quieto = useMenosMovimiento();
  const listaRef = useRef<HTMLUListElement>(null);
  const estadoAnterior = useRef<Flip.FlipState | null>(null);

  // Patrón estándar de Flip en React: el estado "antes" se captura al final
  // de este mismo efecto en el render anterior; cuando `regiones` cambia de
  // orden, el DOM ya está en las posiciones nuevas cuando el efecto vuelve a
  // correr (los layout effects van después de que React pinta), así que
  // `Flip.from` compara ese estado guardado contra la posición real actual.
  useLayoutEffect(() => {
    if (!listaRef.current || quieto) return;
    if (estadoAnterior.current) {
      Flip.from(estadoAnterior.current, {
        targets: listaRef.current.children,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
    estadoAnterior.current = Flip.getState(listaRef.current.children);
  }, [regiones, quieto]);

  return (
    // Sin scroll propio: el scroll lo lleva el contenedor de `Sidebar`, que
    // también arrastra el buscador. Un segundo contenedor de scroll anidado
    // con `overscroll-contain` se tragaba el gesto y la lista no se movía.
    <ul ref={listaRef}>
      {regiones.map((region) => (
        <li key={region.cod}>
          <button
            type="button"
            onClick={() => onSeleccionar(region.cod)}
            className="flex w-full items-baseline justify-between gap-3 border-b border-ink/5 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-atencion/10"
          >
            <span className="truncate text-body-sm">{region.nombre}</span>
            {/* La cifra como distintivo tintado: la lista gana color sin perder
                lectura de columna (ancho mínimo común y tabular-nums). */}
            <span className="shrink-0 rounded-full bg-atencion/10 px-2 py-0.5 text-center font-mono text-caption tabular-nums text-atencion min-w-11">
              {nf.format(region.cumplen)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
