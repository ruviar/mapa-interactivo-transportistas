import type { Hoja } from '../../hooks/useBottomSheet';

/**
 * Asa de la hoja inferior. Solo existe en móvil y tablet: en escritorio el
 * panel es una columna fija y no hay nada que desplegar.
 *
 * Es un `<button>` de verdad y no un adorno arrastrable: el gesto con el dedo
 * es el camino cómodo, pero Enter/Espacio tienen que hacer lo mismo. `touch-none`
 * evita que el navegador se quede el gesto vertical antes de que llegue aquí.
 */
export function SheetHandle({ hoja, controla }: { hoja: Hoja; controla: string }) {
  return (
    <button
      type="button"
      aria-expanded={hoja.desplegada}
      aria-controls={controla}
      {...hoja.gestoAsa}
      // El área de pulsación es toda la anchura, pero el anillo de foco se ciñe
      // a la barra: a lo ancho de la pantalla se le cortan los lados y no se
      // lee como un foco.
      className="group flex w-full touch-none items-center justify-center py-3.5 focus-visible:outline-none lg:hidden"
    >
      <span className="sr-only">
        {hoja.desplegada ? 'Recoger el panel de consulta' : 'Desplegar el panel de consulta'}
      </span>
      {/* Píldora de asidero, como la de cualquier hoja del sistema. */}
      <span
        aria-hidden="true"
        className="block h-[5px] w-9 rounded-full bg-asfalto/50 group-focus-visible:bg-atencion group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-atencion"
      />
    </button>
  );
}
