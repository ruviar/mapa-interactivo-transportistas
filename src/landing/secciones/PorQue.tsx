import { Building2, Clock, Truck, UserRound } from 'lucide-react';

import { IMAGENES } from '../datos/imagenes';
import { Grano } from '../piezas/Grano';
import { ImagenODefecto } from '../piezas/ImagenODefecto';
import { Revelar } from '../piezas/Revelar';
import { Tarjeta } from '../piezas/Tarjeta';

/**
 * Cuatro cifras del sector del transporte de mercancías por carretera en
 * España, no de esta herramienta ni de la base de datos que usa —esa cambia
 * (ver más abajo) y una cifra de marketing sobre "nuestros datos" habría
 * caducado con ella. Esto es contexto: por qué importa un mapa de
 * transportistas en primer lugar. Fuentes en `FUENTES`, más abajo del grid.
 */
const CIFRAS = [
  {
    cifra: '95,7 %',
    icono: Truck,
    titulo: 'La carretera lo mueve casi todo',
    texto:
      'de las toneladas de mercancía transportadas en España van por carretera. El barco se queda en el 3,1 % y el tren, en el 1,3 %.',
    ancho: 'sm:col-span-2',
  },
  {
    cifra: '110.000',
    icono: Building2,
    titulo: 'Un sector muy atomizado',
    texto:
      'empresas de transporte por carretera operan en España, casi todas pequeñas: cinco comunidades reúnen ya más del 60 % del total.',
    ancho: '',
  },
  {
    cifra: '53 %',
    icono: UserRound,
    titulo: 'El camión, casi siempre, es de uno',
    texto:
      'de las empresas del sector trabaja con un único vehículo — el autónomo con su camión, no la gran flota, es la unidad más habitual.',
    ancho: '',
  },
  {
    cifra: '15 años',
    icono: Clock,
    titulo: 'Un parque que envejece',
    texto:
      'es la edad media del camión de transporte de mercancías en España, el segmento más veterano de todo el parque circulante.',
    ancho: 'sm:col-span-2',
  },
] as const;

/**
 * El sector en cifras: cuatro datos públicos en rejilla bento —dos tarjetas a
 * todo el ancho, dos a media— en vez de cuatro cajas iguales en fila. Sustituye
 * a una versión anterior que hablaba de la propia herramienta ("por qué esta
 * herramienta"); aquí se explica por qué importa el tema que trata el mapa,
 * con cifras que no dependen de qué base de datos alimente la coropleta.
 *
 * Al apuntar una tarjeta no se mueve nada: se enciende en ámbar de neón
 * (`.tarjeta` en theme.css) y el icono se enciende con ella vía `group-hover`.
 * La ondulación de la cifra y el destello del icono que había antes se
 * retiraron con la misma razón que el levantamiento de `Tarjeta`: son cuatro
 * bloques de lectura, y cualquier movimiento bajo el cursor compite con el
 * párrafo que se está leyendo. Aquí el hover confirma dónde está el ratón, no
 * hace un número.
 *
 * Fondo navy —el mismo `--color-navy-950` del hero y el pie— en vez del
 * crema del resto de la página: un respiro oscuro a mitad de recorrido, con
 * la nave logística de `porQueFondo` muy oscurecida detrás (overlay navy
 * encima, igual que documenta `public/imagenes/README.md`) y las tarjetas en
 * `Tarjeta` `oscuro` para que sigan leyéndose como superficies propias y no
 * como texto suelto sobre la foto.
 */
export function PorQue() {
  return (
    <section id="por-que" className="relative isolate overflow-hidden bg-navy-950 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20">
        <ImagenODefecto
          imagen={IMAGENES.porQueFondo}
          className="h-full w-full object-cover opacity-[0.22]"
          respaldo={
            <div
              className="h-full w-full"
              style={{
                background: 'linear-gradient(160deg, var(--color-navy-800) 0%, var(--color-navy-950) 70%)',
              }}
            />
          }
        />
        <div className="absolute inset-0 bg-navy-950/70" />
      </div>
      <Grano className="-z-10" />

      <div className="relative mx-auto max-w-6xl">
        <Revelar>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-asfalto">
            El sector, en cifras
          </p>
          <h2 className="rotulo-landing mt-3 max-w-2xl text-titular text-base">
            Casi todo lo que se mueve en España va por carretera.
          </h2>
        </Revelar>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CIFRAS.map((dato, i) => {
            const Icono = dato.icono;
            return (
              <Revelar key={dato.titulo} retardo={i * 0.08} className={dato.ancho}>
                <Tarjeta oscuro className="group h-full">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-heading text-atencion">{dato.cifra}</p>
                    <Icono
                      aria-hidden="true"
                      className="size-5 text-asfalto transition-colors duration-200 group-hover:text-atencion"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="rotulo mt-3 text-label-lg text-base">{dato.titulo}</h3>
                  <p className="mt-2 text-body-sm text-base/70">{dato.texto}</p>
                </Tarjeta>
              </Revelar>
            );
          })}
        </div>

        {/* Mismo criterio de transparencia que `NotaDatos` en la herramienta:
            una cifra sin decir de dónde sale no se distingue de una inventada. */}
        <p className="mt-6 text-caption text-asfalto/70">
          Fuentes: reparto modal nacional y edad media del parque — Ministerio de Transportes y DGT.
          Estructura del sector — DBK Sectorial y Observatorio de costes, precios y actividad.
        </p>
      </div>
    </section>
  );
}
