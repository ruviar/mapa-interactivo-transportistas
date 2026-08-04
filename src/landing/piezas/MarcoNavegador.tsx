import type { ComponentPropsWithoutRef } from 'react';

/**
 * Marco de navegador: barra superior falsa con los tres puntos, esquinas
 * redondeadas y sombra navy. Envuelve el mapa embebido en `SeccionMapa` para
 * que se lea como producto real y no como una caja con borde plano.
 *
 * Solo a partir de `lg`: por debajo, `SeccionMapa` ya usa la ventana entera
 * para el mapa (mismo criterio que documentaba la caja plana anterior — ahí
 * un marco de escritorio encima no pinta nada, solo resta alto a la hoja
 * inferior). El resto de props (incluido `data-lenis-prevent`) se reenvían
 * al contenedor raíz: es quien forma el bloque de contención para el `fixed`
 * de la hoja inferior en móvil, así que tiene que seguir siendo el mismo
 * elemento pase lo que pase con el marco visual.
 *
 * Columna flex y no dos hijos sueltos: el contenido usa `h-full`, que resuelve
 * contra el marco entero y por tanto ignoraba los 32 px de la barra de puntos.
 * La app medía siempre 32 px de más y el `overflow-hidden` de aquí le cortaba
 * justo el pie —la leyenda de la coropleta y la nota metodológica—. Con la
 * columna, el envoltorio `flex-1` es quien recibe el alto restante y `h-full`
 * pasa a medir lo que de verdad queda.
 */
export function MarcoNavegador({
  children,
  className = '',
  ...resto
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...resto}
      className={`flex flex-col overflow-hidden lg:rounded-xl lg:border lg:border-asfalto/25 lg:bg-base lg:shadow-[0_24px_60px_-24px_rgba(12,30,61,0.5)] ${className}`}
    >
      <div className="hidden shrink-0 items-center gap-1.5 border-b border-asfalto/20 bg-asfalto/10 px-3.5 py-2.5 lg:flex">
        <span className="size-2.5 rounded-full bg-asfalto/40" />
        <span className="size-2.5 rounded-full bg-asfalto/40" />
        <span className="size-2.5 rounded-full bg-asfalto/40" />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
