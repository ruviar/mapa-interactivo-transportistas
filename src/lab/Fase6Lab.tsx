import { useState } from 'react';
import type { ReactNode } from 'react';

// Extensión explícita a propósito: en un sistema de archivos que no distingue
// mayúsculas (Windows), './Odometro' sin extensión colisiona con 'odometro.ts'
// y tsc resuelve al módulo equivocado. Con la extensión puesta no hay ambigüedad.
import { Odometro } from '../animation/Odometro.tsx';
import { Pulsable } from '../animation/Pulsable';

export function Fase6Lab() {
  const [valor, setValor] = useState(42839);

  return (
    <div className="min-h-dvh bg-base p-8 font-sans text-ink">
      <h1 className="rotulo text-heading">Banco · Fase 6</h1>
      <p className="mt-1 text-body-sm text-asfalto">
        Piezas sueltas para acordar la sensación. No es la aplicación.
      </p>

      <Banco titulo="Odómetro · las dos mecánicas">
        <div className="flex flex-wrap items-end gap-10">
          <div>
            <p className="text-caption text-asfalto">Rueda real</p>
            <Odometro
              valor={valor}
              mecanica="rueda"
              className="font-mono text-display font-medium"
            />
          </div>
          <div>
            <p className="text-caption text-asfalto">Por columna</p>
            <Odometro
              valor={valor}
              mecanica="columna"
              className="font-mono text-display font-medium"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Boton onClick={() => setValor((v) => v + 7)}>+7</Boton>
          <Boton onClick={() => setValor((v) => Math.max(0, v - 348))}>−348</Boton>
          <Boton onClick={() => setValor(3120)}>Salto grande (3.120)</Boton>
          <Boton onClick={() => setValor(42839)}>Volver (42.839)</Boton>
          <Boton onClick={() => setValor(999)}>999 → prueba de dígito nuevo</Boton>
        </div>

        {/* Imita el slider de umbral: el valor cambia en cada píxel del gesto. */}
        <label className="mt-5 block max-w-md">
          <span className="text-caption text-asfalto">Barrido continuo (como el umbral)</span>
          <input
            type="range"
            min={0}
            max={45000}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            className="slider-umbral mt-1 w-full"
          />
        </label>
      </Banco>

      <Banco titulo="Pulsación física">
        <ul className="max-w-md border-y border-asfalto/25">
          {['Cataluña', 'Andalucía', 'Comunidad de Madrid'].map((nombre) => (
            <li key={nombre}>
              <Pulsable
                elevado
                type="button"
                className="flex w-full items-baseline justify-between gap-3 border-b border-asfalto/25 bg-base px-4 py-2.5 text-left last:border-b-0"
              >
                <span className="truncate text-body-sm">{nombre}</span>
                <span className="font-mono text-body-sm tabular-nums text-asfalto">1.234</span>
              </Pulsable>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Pulsable
            type="button"
            className="text-caption text-atencion underline-offset-2 hover:underline"
          >
            Control plano (breadcrumb)
          </Pulsable>
          <Pulsable type="button" className="text-caption text-asfalto hover:text-ink">
            Cabecera de orden
          </Pulsable>
        </div>
      </Banco>
    </div>
  );
}

function Boton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-asfalto px-3 py-1.5 text-body-sm hover:bg-atencion/12"
    >
      {children}
    </button>
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
