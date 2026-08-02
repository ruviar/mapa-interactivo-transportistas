import { animate, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';

import { useMenosMovimiento } from './fisica';
import {
  ALTURAS_TAMBOR,
  columnasDe,
  digitoDe,
  enVentana,
  formatear,
  pasoCorto,
} from './odometro';
import { RESORTE_ODOMETRO } from './resortes';

/**
 * `rueda`: un solo muelle tira del valor y cada columna deriva su giro de él,
 * así que la decena solo se mueve cuando la unidad pasa de nueve. Fiel.
 * `columna`: cada columna va a su dígito por el camino corto, escalonadas.
 * Legible en saltos grandes.
 */
export type Mecanica = 'rueda' | 'columna';

/** Retardo entre columnas en la mecánica por columna, de derecha a izquierda. */
const ESCALON = 0.018;

const GLIFOS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

interface Props {
  valor: number | null;
  mecanica?: Mecanica;
  className?: string;
}

/**
 * Cifra que rueda como un cuentakilómetros. Solo la usan los dos contadores
 * grandes: las cifras sobre el mapa cambian en seco, porque cincuenta y dos
 * números rodando a la vez en cada píxel del slider son ruido, no materialidad.
 */
export function Odometro({ valor, mecanica = 'rueda', className = '' }: Props) {
  const quieto = useMenosMovimiento();
  const texto = valor === null ? '—' : formatear(valor);

  if (valor === null || quieto) {
    return <span className={className}>{texto}</span>;
  }

  return (
    <span className={className}>
      {/* La cifra final, una sola vez, para quien escucha la página: el
          aria-live del contador leería si no cada estado intermedio del muelle. */}
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true" className="inline-flex">
        <Cifra valor={valor} mecanica={mecanica} />
      </span>
    </span>
  );
}

function Cifra({ valor, mecanica }: { valor: number; mecanica: Mecanica }) {
  const bruto = useMotionValue(valor);
  const suave = useSpring(bruto, RESORTE_ODOMETRO);

  useEffect(() => {
    bruto.set(valor);
  }, [bruto, valor]);

  const columnas = columnasDe(valor);
  const digitos = columnas.filter((c) => c.tipo === 'digito').length;
  let vistos = 0;

  return (
    <>
      {columnas.map((columna, i) => {
        if (columna.tipo === 'fijo') {
          return (
            <span key={`fijo-${i}`} className="tabular-nums">
              {columna.texto}
            </span>
          );
        }
        // De derecha a izquierda: la columna de las unidades arranca primero.
        const desdeLaDerecha = digitos - 1 - vistos;
        vistos += 1;

        return mecanica === 'rueda' ? (
          <TamborRueda key={columna.peso} valor={suave} peso={columna.peso} />
        ) : (
          <TamborColumna
            key={columna.peso}
            valor={valor}
            peso={columna.peso}
            retardo={desdeLaDerecha * ESCALON}
          />
        );
      })}
    </>
  );
}

/** Mecánica de rueda: la posición sale del valor suavizado, sin estado propio. */
function TamborRueda({ valor, peso }: { valor: MotionValue<number>; peso: number }) {
  const y = useTransform(valor, (v) => `${(-enVentana(v / peso) * 100) / ALTURAS_TAMBOR}%`);
  return <Tambor y={y} />;
}

/** Mecánica por columna: posición propia que acumula pasos cortos. */
function TamborColumna({
  valor,
  peso,
  retardo,
}: {
  valor: number;
  peso: number;
  retardo: number;
}) {
  const posicion = useMotionValue(digitoDe(valor, peso));
  const y = useTransform(posicion, (p) => `${(-enVentana(p) * 100) / ALTURAS_TAMBOR}%`);
  const anterior = useRef(digitoDe(valor, peso));

  useEffect(() => {
    const destino = digitoDe(valor, peso);
    const paso = pasoCorto(anterior.current, destino);
    anterior.current = destino;
    if (paso === 0) return;

    const control = animate(posicion, posicion.get() + paso, { ...RESORTE_ODOMETRO, delay: retardo });
    return () => control.stop();
  }, [valor, peso, posicion, retardo]);

  return <Tambor y={y} />;
}

/**
 * Tira de once glifos —0..9 más otro 0— desplazada en porcentaje de su propia
 * altura. Sin medir nada: el porcentaje se recalcula solo cuando cambia el
 * tamaño del texto o terminan de cargar las tipografías. El glifo de cierre
 * hace que la vuelta de 9 a 0 caiga entre dos ceros iguales y no se vea.
 */
function Tambor({ y }: { y: MotionValue<string> }) {
  return (
    <span className="relative inline-block overflow-hidden tabular-nums">
      <span className="invisible">0</span>
      <motion.span style={{ y }} className="absolute left-0 top-0">
        {GLIFOS.map((glifo, i) => (
          <span key={i} className="block">
            {glifo}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
