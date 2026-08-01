import type { ReactNode } from 'react';

/**
 * Banco de pruebas de la Fase 6. Se abre con `?lab` y sirve para acordar la
 * sensación de cada pieza antes de repartirla por la interfaz.
 *
 * Se borra entero al cerrar la fase: este archivo y tres líneas de main.tsx.
 */
export function Fase6Lab() {
  return (
    <div className="min-h-dvh bg-base p-8 font-sans text-ink">
      <h1 className="rotulo text-heading">Banco · Fase 6</h1>
      <p className="mt-1 text-body-sm text-asfalto">
        Piezas sueltas para acordar la sensación. No es la aplicación.
      </p>
    </div>
  );
}

export function Banco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-asfalto/40 pt-4">
      <h2 className="text-caption uppercase tracking-wider text-asfalto">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
