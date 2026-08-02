import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as EventoPuntero } from 'react';

import { useMediaQuery } from './useMediaQuery';

/** Por debajo de `lg` (1024 px) el panel es hoja inferior; por encima, columna fija. */
const CONSULTA_HOJA = '(max-width: 1023.98px)';
/** Arrastre a partir del cual el gesto decide el estado final. */
const UMBRAL_GESTO = 56;
/** Por debajo de esto el gesto es un toque y lo resuelve el `click` del asa. */
const UMBRAL_TOQUE = 12;

export interface Hoja {
  /** ¿Estamos en el patrón de hoja inferior (móvil/tablet)? */
  esHoja: boolean;
  desplegada: boolean;
  /** Alto visible con la hoja recogida. El mapa reserva ese hueco al encuadrar. */
  asomo: number;
  /** Píxeles que la hoja baja ahora mismo. 0 = desplegada del todo. */
  desplazamiento: number;
  /** Con el dedo encima no puede haber transición: la hoja sigue al pulgar. */
  arrastrando: boolean;
  refHoja: (el: HTMLElement | null) => void;
  /** Va en el bloque que queda a la vista con la hoja recogida. */
  refAsomo: (el: HTMLElement | null) => void;
  /** Manejadores del asa: arrastre con el dedo y toque/teclado para alternar. */
  gestoAsa: {
    onPointerDown: (e: EventoPuntero<HTMLElement>) => void;
    onPointerMove: (e: EventoPuntero<HTMLElement>) => void;
    onPointerUp: (e: EventoPuntero<HTMLElement>) => void;
    onPointerCancel: () => void;
    onClick: () => void;
  };
}

const acotar = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Estado del panel como hoja inferior en móvil y tablet.
 *
 * La hoja no participa del layout: es `position: fixed` con alto propio y se
 * mueve con `transform`. Es deliberado — el panel como ítem flex ya provocó
 * una vez que el listado se quedara sin altura que medir y se desbordara sobre
 * el pie. Aquí el único número que se mide es el asomo, y solo para saber
 * cuánto hay que bajarla.
 *
 * @param clave  identidad de la vista: cada navegación recoloca la hoja.
 * @param nivel  nivel de la vista actual; en provincia la hoja sube sola.
 */
export function useBottomSheet(clave: string, nivel: 'nacional' | 'ccaa' | 'provincia'): Hoja {
  const esHoja = useMediaQuery(CONSULTA_HOJA);

  const [desplegada, setDesplegada] = useState(false);
  const [medidas, setMedidas] = useState({ alto: 0, asomo: 0 });
  const [arrastre, setArrastre] = useState<number | null>(null);

  // Elementos como estado y no como ref: así el observador de tamaño se monta
  // en cuanto React los ata, sin un render extra a ciegas.
  const [elHoja, refHoja] = useState<HTMLElement | null>(null);
  const [elAsomo, refAsomo] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!elHoja || !elAsomo) return;

    const medir = () => setMedidas({ alto: elHoja.offsetHeight, asomo: elAsomo.offsetHeight });
    medir();

    // El asomo crece cuando el breadcrumb se parte en dos líneas (Castilla-La
    // Mancha › Ciudad Real) o cuando terminan de cargar las tipografías.
    const observador = new ResizeObserver(medir);
    observador.observe(elHoja);
    observador.observe(elAsomo);
    return () => observador.disconnect();
  }, [elHoja, elAsomo]);

  // Cada navegación recoloca la hoja: al abrir provincia sube (es el listado lo
  // que se ha pedido), al volver a comunidad o a España baja para no tapar el
  // vuelo del mapa. Entre navegaciones manda lo que haya hecho el usuario.
  useEffect(() => {
    setDesplegada(nivel === 'provincia');
  }, [clave, nivel]);

  useEffect(() => {
    if (!esHoja || !desplegada) return;
    const alPulsar = (e: KeyboardEvent) => {
      // El buscador también usa Escape para vaciarse; si ya lo ha consumido,
      // recoger la hoja encima sería quitar dos cosas de una sola pulsación.
      if (e.key === 'Escape' && !e.defaultPrevented) setDesplegada(false);
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [esHoja, desplegada]);

  const oculto = Math.max(medidas.alto - medidas.asomo, 0);
  const base = desplegada ? 0 : oculto;
  const desplazamiento = arrastre === null ? base : acotar(base + arrastre, 0, oculto);

  const origen = useRef(0);
  const suprimirClic = useRef(false);

  const onPointerDown = useCallback(
    (e: EventoPuntero<HTMLElement>) => {
      if (!esHoja) return;
      origen.current = e.clientY;
      setArrastre(0);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [esHoja],
  );

  const onPointerMove = useCallback(
    (e: EventoPuntero<HTMLElement>) => {
      if (arrastre === null) return;
      setArrastre(e.clientY - origen.current);
    },
    [arrastre],
  );

  const onPointerUp = useCallback(
    (e: EventoPuntero<HTMLElement>) => {
      if (arrastre === null) return;
      const recorrido = e.clientY - origen.current;
      setArrastre(null);

      // Un desplazamiento mínimo es un toque con pulso, no un gesto: se deja
      // que lo resuelva el `click` (que es también el camino del teclado).
      if (Math.abs(recorrido) < UMBRAL_TOQUE) return;

      suprimirClic.current = true;
      if (recorrido <= -UMBRAL_GESTO) setDesplegada(true);
      else if (recorrido >= UMBRAL_GESTO) setDesplegada(false);
    },
    [arrastre],
  );

  const onPointerCancel = useCallback(() => setArrastre(null), []);

  const onClick = useCallback(() => {
    if (suprimirClic.current) {
      suprimirClic.current = false;
      return;
    }
    setDesplegada((abierta) => !abierta);
  }, []);

  return {
    esHoja,
    desplegada,
    asomo: medidas.asomo,
    desplazamiento,
    arrastrando: arrastre !== null,
    refHoja,
    refAsomo,
    gestoAsa: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick },
  };
}
