import { Map, ShieldCheck, Unlock, Zap } from 'lucide-react';
import { motion } from 'motion/react';

import { useMenosMovimiento } from '../../animation/fisica';
import { Revelar } from '../piezas/Revelar';
import { Tarjeta } from '../piezas/Tarjeta';

const RAZONES = [
  {
    cifra: '17 · 52',
    icono: Map,
    titulo: 'España entera',
    texto: 'Todas las comunidades autónomas y provincias, no una muestra ni una selección.',
    ancho: 'sm:col-span-2',
    ondula: false,
    destella: false,
  },
  {
    cifra: '≈',
    icono: ShieldCheck,
    titulo: 'Proxy declarado, no inventado',
    texto:
      'No hay un registro público del nº de camiones por empresa. Usamos la plantilla como estimación y lo decimos donde se usa, no lo escondemos.',
    ancho: '',
    ondula: true,
    destella: false,
  },
  {
    cifra: '0€',
    icono: Unlock,
    titulo: 'Sin registro',
    texto: 'Se explora libremente, sin crear cuenta ni dejar ningún dato para empezar a buscar.',
    ancho: '',
    ondula: false,
    destella: false,
  },
  {
    cifra: '⌁',
    icono: Zap,
    titulo: 'Hecho para ser rápido',
    texto:
      'El filtro y la búsqueda corren en el propio navegador: cambian el listado al momento, sin ida y vuelta a un servidor.',
    ancho: 'sm:col-span-2',
    ondula: false,
    destella: true,
  },
] as const;

/**
 * Por qué esta herramienta: cuatro razones en rejilla bento —dos tarjetas a
 * todo el ancho, dos a media— en vez de cuatro cajas iguales en fila. La
 * cifra y el icono se activan solo al pasar el cursor (ondulación / destello):
 * ningún bucle decorativo antes de la interacción, mismo criterio que
 * `Tarjeta.tsx`.
 */
export function PorQue() {
  const quieto = useMenosMovimiento();

  return (
    <section
      id="por-que"
      className="bg-[color-mix(in_oklab,var(--color-base)_100%,var(--color-asfalto)_6%)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <Revelar>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-asfalto">
            Por qué esta herramienta
          </p>
          <h2 className="rotulo-landing mt-3 max-w-2xl text-titular text-ink">
            Un instrumento de consulta, no un escaparate.
          </h2>
        </Revelar>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {RAZONES.map((razon, i) => {
            const Icono = razon.icono;
            return (
              <Revelar key={razon.titulo} retardo={i * 0.08} className={razon.ancho}>
                <Tarjeta className="h-full">
                  <div className="flex items-center justify-between">
                    {quieto || !razon.ondula ? (
                      <p className="font-mono text-heading text-atencion">{razon.cifra}</p>
                    ) : (
                      <motion.p
                        className="font-mono text-heading text-atencion"
                        whileHover={{ y: [0, -3, 2, 0] }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                      >
                        {razon.cifra}
                      </motion.p>
                    )}

                    {quieto || !razon.destella ? (
                      <Icono aria-hidden="true" className="size-5 text-asfalto" strokeWidth={1.5} />
                    ) : (
                      <motion.span
                        whileHover={{ opacity: [1, 0.25, 1] }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                      >
                        <Icono aria-hidden="true" className="size-5 text-atencion" strokeWidth={1.5} />
                      </motion.span>
                    )}
                  </div>
                  <h3 className="rotulo mt-3 text-label-lg text-ink">{razon.titulo}</h3>
                  <p className="mt-2 text-body-sm text-ink/70">{razon.texto}</p>
                </Tarjeta>
              </Revelar>
            );
          })}
        </div>
      </div>
    </section>
  );
}
