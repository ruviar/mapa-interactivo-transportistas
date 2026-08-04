import { Layers, Map, SlidersHorizontal, type LucideIcon } from 'lucide-react';

import { IMAGENES, type Imagen } from '../datos/imagenes';
import { ImagenODefecto } from '../piezas/ImagenODefecto';
import { MarcoNavegador } from '../piezas/MarcoNavegador';
import { Revelar } from '../piezas/Revelar';

interface Momento {
  numero: string;
  titulo: string;
  texto: string;
  imagen: Imagen;
  icono: LucideIcon;
  /** Posición del callout, en % de la caja de la captura. */
  callout: { top: string; left: string; texto: string };
}

const MOMENTOS: Momento[] = [
  {
    numero: '01',
    titulo: 'España entera, por densidad',
    texto: 'Las 17 comunidades autónomas coloreadas según cuántas empresas de transporte tienen.',
    imagen: IMAGENES.mapaEspana,
    icono: Map,
    callout: { top: '30%', left: '58%', texto: 'Color = nº de empresas' },
  },
  {
    numero: '02',
    titulo: 'Una comunidad, sus provincias',
    texto: 'Un clic abre la comunidad elegida y separa sus provincias, cada una con su cifra.',
    imagen: IMAGENES.mapaProvincia,
    icono: Layers,
    callout: { top: '42%', left: '48%', texto: 'Cada provincia, su recuento' },
  },
  {
    numero: '03',
    titulo: 'Filtra y consulta el listado',
    texto: 'Dentro de una provincia, mueve el umbral de plantilla y el listado se recalcula al momento.',
    imagen: IMAGENES.mapaListado,
    icono: SlidersHorizontal,
    callout: { top: '58%', left: '76%', texto: 'Umbral + listado en vivo' },
  },
];

/**
 * Así funciona el mapa: las tres capturas del Paso 0.A (ver
 * `datos/imagenes.ts`), en un filmstrip horizontal, entre el hero y la
 * herramienta embebida de `SeccionMapa`. Reemplaza a la antigua
 * `ComoFunciona` —tres tarjetas de solo texto con una línea de `drawSVG` que
 * se dibujaba a scroll— por la prueba visual: no hace falta describir los
 * tres pasos si se pueden enseñar.
 *
 * Sin `ScrollTrigger.pin` ni `scrub`: la lección de esa sección anterior (la
 * línea nunca llegaba a dispararse bien) es que un scroll fino atado a una
 * animación de trazado es frágil. Aquí solo `Revelar` con `modo="en-vista"`
 * —un fundido con `whileInView`, sin scrub— y un único retardo para el
 * filmstrip entero, no un escalonamiento por tarjeta: las tres capturas
 * cuentan una sola historia y deben leerse como un bloque, no como tres
 * apariciones sueltas.
 */
export function AsiFuncionaElMapa() {
  return (
    <section id="asi-funciona" className="bg-base px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Revelar>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-asfalto">
            Así funciona el mapa
          </p>
          <h2 className="rotulo-landing mt-3 max-w-2xl text-titular text-ink">
            Tres capturas, cero pasos a ciegas.
          </h2>
        </Revelar>

        <Revelar retardo={0.1} className="mt-10 grid gap-6 sm:grid-cols-3">
          {MOMENTOS.map((momento) => {
            const Icono = momento.icono;
            return (
              <div key={momento.numero}>
                <MarcoNavegador className="w-full">
                  <div className="relative aspect-[4/3] w-full">
                    <ImagenODefecto
                      imagen={momento.imagen}
                      className="absolute inset-0 h-full w-full object-cover"
                      respaldo={<RespaldoCaptura icono={momento.icono} />}
                    />
                    <Callout {...momento.callout} />
                  </div>
                </MarcoNavegador>

                <div className="mt-4 flex items-center gap-2">
                  <p className="font-mono text-label-lg text-atencion">{momento.numero}</p>
                  <Icono aria-hidden="true" className="size-4 text-asfalto" strokeWidth={1.5} />
                </div>
                <h3 className="rotulo mt-2 text-label-lg text-ink">{momento.titulo}</h3>
                <p className="mt-1 text-body-sm text-ink/70">{momento.texto}</p>
              </div>
            );
          })}
        </Revelar>
      </div>
    </section>
  );
}

/** Hueco de captura mientras `public/imagenes/` no tenga el archivo: ver `ImagenODefecto`. */
function RespaldoCaptura({ icono: Icono }: { icono: LucideIcon }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background:
          'linear-gradient(135deg, var(--color-mar) 0%, var(--color-base) 55%, var(--color-mapa-2) 130%)',
      }}
    >
      <Icono aria-hidden="true" className="size-8 text-navy-800/35" strokeWidth={1.25} />
    </div>
  );
}

/**
 * Anotación sobre la captura: un punto de ámbar y una etiqueta, la misma
 * pareja que usan los hitos de `RedDeRutas` en el hero. `aria-hidden`: es
 * refuerzo visual de algo que el título y el texto de abajo ya dicen en
 * prosa, no información nueva.
 */
function Callout({ top, left, texto }: { top: string; left: string; texto: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
      style={{ top, left }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0 overflow-visible">
        <circle
          cx="7"
          cy="7"
          r="5.5"
          fill="var(--color-atencion)"
          fillOpacity="0.25"
          stroke="var(--color-atencion)"
          strokeWidth="1.5"
        />
        <circle cx="7" cy="7" r="2" fill="var(--color-atencion)" />
      </svg>
      <span className="whitespace-nowrap rounded-sm bg-navy-950/85 px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-base">
        {texto}
      </span>
    </div>
  );
}
