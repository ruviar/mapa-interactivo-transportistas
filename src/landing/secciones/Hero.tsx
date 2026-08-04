import { ChevronDown } from 'lucide-react';
import { motion, useInView, useMotionValue, useScroll, useTransform } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';

import { useMenosMovimiento } from '../../animation/fisica';
// Extensión explícita: en un filesystem que no distingue mayúsculas
// (Windows), './Odometro' colisiona con './odometro.ts' y resuelve al
// módulo equivocado.
import { Odometro } from '../../animation/Odometro.tsx';
import { gsap, SplitText } from '../../animation/gsap';
import { useIrAVista } from '../../Raiz';
import { IMAGENES } from '../datos/imagenes';
import { Accion } from '../piezas/Accion';
import { ImagenODefecto } from '../piezas/ImagenODefecto';
import { NUDO_RELATIVO, RedDeRutas } from '../piezas/RedDeRutas';
import { Revelar } from '../piezas/Revelar';

/** Cifras contables van con `valor` (rueda en Odometro); códigos, con `texto` fijo. */
const FICHA = [
  { valor: 17, etiqueta: 'comunidades' },
  { valor: 52, etiqueta: 'provincias' },
  { texto: '4941 · 4939', etiqueta: 'CNAE de carretera' },
] as const;

/**
 * El cielo del hero. El navy más oscuro aguanta hasta bien abajo y el ámbar
 * solo asoma en la última franja: repartidos a medias, navy y ámbar se
 * cruzan en un marrón de charco que no se parece a ningún amanecer.
 *
 * Sigue siendo el fondo real de la sección aunque encima vaya la fotografía
 * (`hero-bg`): la foto va al 55% de opacidad sobre esto, así que el navy es a
 * la vez el fondo de repuesto mientras el archivo no exista y el "overlay
 * navy" que mantiene legible el texto blanco cuando exista. Un overlay aparte
 * por encima de la foto haría lo mismo pero oscurecería el amanecer los días
 * en que no hay foto.
 */
const AMANECER =
  'linear-gradient(180deg, var(--color-navy-950) 0%, var(--color-navy-800) 54%,' +
  ' color-mix(in oklab, var(--color-atencion) 26%, var(--color-navy-800)) 80%,' +
  ' color-mix(in oklab, var(--color-atencion) 90%, var(--color-navy-800)) 100%)';

/**
 * La fotografía se retira de donde vive el texto. El titular ocupa la columna
 * izquierda, así que la máscara deja la foto casi apagada ahí y entera a la
 * derecha, que es donde solo hay cielo y corredores.
 */
const MASCARA_FOTO =
  'linear-gradient(100deg, transparent 0%, rgba(0,0,0,0.28) 34%, rgba(0,0,0,0.85) 68%, #000 100%)';

/**
 * Hero: la hora a la que se mueve la mercancía por carretera. Navy de
 * madrugada arriba, el amanecer abriéndose por abajo, y la red de corredores
 * dibujándose a la derecha mientras el titular ocupa la columna izquierda.
 */
export function Hero() {
  const quieto = useMenosMovimiento();
  const irAVista = useIrAVista();

  // Progreso de salida del hero: 0 con el hero encuadrado, 1 cuando su borde
  // inferior alcanza el alto de la ventana — exactamente el tramo en que el
  // hero se va. Con `target` propio y no recibido por prop: nada más en la
  // página necesita ya este valor (dejó de haberlo desde que `SeccionMapa`
  // perdió el scrollytelling), así que vive donde se usa.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  // Los hooks no pueden ir detrás de un `if`, así que el valor de repuesto se
  // crea siempre y solo se usa cuando alguien ha pedido menos movimiento.
  const parado = useMotionValue(0);
  const progreso = quieto ? parado : scrollYProgress;

  // La red converge hacia su propio nudo y se apaga; el texto se queda un poco
  // atrás. Solo `transform` y `opacity`: cualquier otra propiedad aquí obliga
  // al navegador a recalcular la maqueta en cada fotograma del scroll.
  //
  // Los rangos que acaban antes del 1 llevan un tramo llano hasta el final en
  // vez de cortarse: fuera del rango de entrada esta versión de Motion
  // extrapola en lugar de recortar, y la red se apagaba a mitad del hero para
  // volver a encenderse sola justo cuando debía estar ya fundida.
  const opacidadRutas = useTransform(progreso, [0, 0.68, 1], [1, 0, 0]);
  const escalaRutas = useTransform(progreso, [0, 1], [1, 0.68]);
  const desplazamiento = useTransform(progreso, [0, 1], [0, 88]);
  const opacidadTexto = useTransform(progreso, [0, 0.8, 1], [1, 0, 0]);

  // Parallax del fondo: baja mientras la página sube, así que se mueve menos
  // que el texto (~0.4 de su recorrido). En `translateY` y nunca en `top` ni
  // en `background-position` — esas dos obligan a recalcular maqueta o a
  // repintar el fondo entero en cada fotograma, y ahí se va el scroll suave.
  //
  // El 12% es porcentaje del alto de la capa, y la capa mide un 124% de la
  // sección repartido a partes iguales arriba y abajo: al desplazarse ese 12%
  // consume justo la holgura de arriba y nunca deja ver el borde.
  const desplazamientoFondo = useTransform(progreso, [0, 1], ['0%', '12%']);

  const tituloRef = useRef<HTMLHeadingElement>(null);

  // GSAP SplitText, por palabras: único uso de SplitText del sitio, reservado
  // al titular. `useLayoutEffect` y no `useEffect` para fijar el estado
  // inicial (oculto) antes del primer pintado y no dejar un parpadeo del
  // titular entero antes de partirse en palabras.
  useLayoutEffect(() => {
    if (quieto || !tituloRef.current) return;

    const split = new SplitText(tituloRef.current, { type: 'words' });
    const animacion = gsap.from(split.words, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.04,
      delay: 0.2,
      ease: 'power3.out',
    });

    return () => {
      animacion.kill();
      split.revert();
    };
  }, [quieto]);

  // La ficha cuenta desde 0 solo la primera vez que entra en pantalla: si
  // volviera a contar en cada scroll de ida y vuelta dejaría de leerse como
  // una cifra y pasaría a ser un tic.
  const fichaRef = useRef<HTMLDListElement>(null);
  const fichaEnVista = useInView(fichaRef, { once: true, amount: 0.6 });

  return (
    /**
     * `min-h-dvh` y no `svh`: el hero ocupa exactamente el viewport visible.
     *
     * Pero el bug de los CTA por debajo del pliegue en 1366×768 no era la
     * unidad —ya era `svh`, que también descuenta la barra del navegador—,
     * era el contenido: centrado con `justify-center`, un bloque más alto que
     * la ventana se desborda por arriba y por abajo a partes iguales, y lo
     * primero que se sale por abajo son los botones. De ahí que aquí todo el
     * ritmo vertical vaya en `clamp()` con tramo en `vh` (y el titular en
     * `--text-hero`, ver theme.css): en una ventana baja el bloque encoge en
     * vez de desbordarse.
     *
     * El mínimo del relleno vertical es 5,5rem porque la navegación es fija y
     * mide ~4,5rem: por debajo de eso el texto se le metería debajo.
     */
    <section
      ref={heroRef}
      className="relative isolate flex min-h-dvh flex-col justify-center overflow-hidden px-5 py-[clamp(5.5rem,11vh,7.5rem)] sm:px-8"
      style={{ background: AMANECER }}
    >
      {/* IMAGEN PENDIENTE: hero-bg — prompt en public/imagenes/README.md
          (sección B) y en src/landing/datos/imagenes.ts. Mientras no esté, el
          respaldo es un resplandor sobre el nudo de rutas y el hero se ve
          exactamente como antes de esta iteración. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
        style={{ maskImage: MASCARA_FOTO, WebkitMaskImage: MASCARA_FOTO }}
      >
        <motion.div
          className="absolute inset-x-0 -top-[12%] h-[124%]"
          style={{ y: desplazamientoFondo }}
        >
          <ImagenODefecto
            imagen={IMAGENES.heroFondo}
            loading="eager"
            className="h-full w-full object-cover opacity-[0.55]"
            respaldo={
              <div
                className="h-full w-full"
                style={{
                  background: `radial-gradient(58% 52% at ${NUDO_RELATIVO.x * 100}% ${
                    NUDO_RELATIVO.y * 100
                  }%, color-mix(in oklab, var(--color-atencion) 16%, transparent) 0%, transparent 70%)`,
                }}
              />
            }
          />
        </motion.div>
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          opacity: opacidadRutas,
          scale: escalaRutas,
          transformOrigin: `${NUDO_RELATIVO.x * 100}% ${NUDO_RELATIVO.y * 100}%`,
        }}
      >
        <RedDeRutas className="h-full w-full" />
      </motion.div>

      {/* Más ancho que el `max-w-6xl` del resto de secciones a propósito: con
          aquel, en una pantalla de 1920 el texto arrancaba a 384 px del borde
          y se plantaba encima del nudo de rutas y de la curva de la autopista.
          Al ensanchar el contenedor el bloque se va hacia el margen y libera
          la mitad derecha, que es donde está el dibujo. */}
      <motion.div
        className="mx-auto w-full max-w-[96rem]"
        style={{ y: desplazamiento, opacity: opacidadTexto }}
      >
        <div className="max-w-xl">
          <Revelar modo="entrada">
            <p className="font-mono text-caption uppercase tracking-[0.22em] text-base/70">
              Transporte de mercancías por carretera · España
            </p>
          </Revelar>

          <h1
            ref={tituloRef}
            className="rotulo-landing mt-[clamp(0.75rem,2vh,1.25rem)] text-hero text-base"
          >
            El transporte de mercancías de España, provincia a provincia.
          </h1>

          <Revelar modo="entrada" retardo={0.2}>
            <p className="mt-[clamp(1rem,2.6vh,1.5rem)] text-body text-base/80 sm:text-label-lg">
              Deja de cruzar registros mercantiles a mano. Filtra las empresas de transporte de
              mercancías por carretera de España por comunidad, provincia y tamaño de plantilla, y
              ten el listado en pantalla desde el primer clic — sin crear cuenta ni esperas.
            </p>
          </Revelar>

          <Revelar modo="entrada" retardo={0.3}>
            <div className="mt-[clamp(1.5rem,4vh,2.5rem)] flex flex-wrap items-center gap-3">
              <Accion
                href="?app"
                onClick={(e) => {
                  e.preventDefault();
                  irAVista('app');
                }}
                magnetico
              >
                Ir al mapa
              </Accion>
              <Accion href="#contacto" tono="contorno" magnetico>
                Hablar con nosotros
              </Accion>
            </div>
          </Revelar>

          <Revelar modo="entrada" retardo={0.42}>
            <dl
              ref={fichaRef}
              className="mt-[clamp(1.5rem,4.5vh,3.5rem)] flex flex-wrap gap-x-8 gap-y-4 border-t border-base/20 pt-[clamp(1rem,2.4vh,1.5rem)] sm:gap-x-10"
            >
              {FICHA.map((item) => (
                <div key={item.etiqueta}>
                  <dt className="font-mono text-label-lg tabular-nums text-atencion">
                    {'valor' in item ? (
                      // `mecanica="columna"`: la mecánica "rueda" tiene un bug de
                      // render preexistente en columnas de decenas o más (ya
                      // reproducible en el banco de Fase 6, ajeno a este cambio).
                      <Odometro valor={fichaEnVista ? item.valor : 0} mecanica="columna" />
                    ) : (
                      item.texto
                    )}
                  </dt>
                  <dd className="mt-1 text-caption uppercase tracking-[0.14em] text-base/60">
                    {item.etiqueta}
                  </dd>
                </div>
              ))}
            </dl>
          </Revelar>
        </div>
      </motion.div>

      {/* Indicador de scroll. Solo en escritorio: es donde el hero deja hueco
          libre bajo la ficha, y en móvil el pulgar ya sabe que hay que subir.
          Decorativo (`aria-hidden`) y no un enlace — los dos CTA de arriba ya
          llevan a donde hay que ir, uno más sería ruido en el orden de foco. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center lg:flex"
        style={{ opacity: opacidadTexto }}
      >
        <motion.span
          className="text-base/45"
          animate={quieto ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 1.9, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }}
        >
          <ChevronDown className="size-5" strokeWidth={1.5} />
        </motion.span>
      </motion.div>
    </section>
  );
}
