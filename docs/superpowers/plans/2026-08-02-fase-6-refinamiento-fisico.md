# Fase 6 — Refinamiento visual físico: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que paneles, números y regiones se comporten como objetos con peso —contadores que ruedan, controles que se hunden, mar de carta náutica, elevación coherente— sin salir del lenguaje de señalética de `DESIGN_SYSTEM.md`.

**Architecture:** Una capa delgada de física (`src/animation/`) con las constantes de resorte en un único módulo puro y dos primitivas de React encima (`<Odometro>`, `<Pulsable>`). Los componentes consumen; no definen muelles. Lo que no cabe en React —las provincias del mapa y el mar— usa las mismas constantes desde Leaflet.

**Tech Stack:** React 19 + TypeScript + Vite 8, Tailwind 4 (tokens en `theme.css`), Leaflet + react-leaflet, `motion` 12 (`motion/react`), `node --test` con TypeScript nativo de Node 24.

Spec: `docs/superpowers/specs/2026-08-02-fase-6-refinamiento-fisico-design.md`

## Global Constraints

- **Paleta intacta.** Ni un color nuevo. Todo hex vive en `theme.css`; el JS lo lee con `getComputedStyle`, como ya hace `leerPaleta()`.
- **Sin gradientes de fondo, glassmorphism ni partículas.** Sin Three.js, WebGL ni librerías 3D.
- **`prefers-reduced-motion` en todo lo nuevo.** El bloque global de `theme.css` solo mata CSS: no protege nada de esta fase. Cada primitiva consulta `useMenosMovimiento()` explícitamente.
- **Ningún componente escribe `stiffness`, `damping` ni una sombra a mano.** Todo sale de `src/animation/resortes.ts` y de los tokens `--shadow-*`.
- **Comentarios en español**, en el tono del código existente: explican *por qué*, no *qué*.
- **TypeScript estricto** con `noUncheckedIndexedAccess` y `noUnusedLocals` activos: el acceso por índice devuelve `T | undefined`.
- **Cada commit termina con** `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **Verificación en navegador obligatoria** al cerrar cada tarea que toque la interfaz: compilar y pasar tests no es verificación visual.

---

### Task 1: Andamiaje — git, Motion, runner de tests y banco de pruebas

El proyecto no es un repositorio git todavía, así que la primera tarea lo crea: sin él no hay commits por tarea ni forma de deshacer.

**Files:**
- Create: `src/animation/resortes.ts`
- Create: `src/animation/resortes.test.ts`
- Create: `src/animation/fisica.ts`
- Create: `src/lab/Fase6Lab.tsx`
- Modify: `src/main.tsx`
- Modify: `tsconfig.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `Resorte = { type: 'spring'; stiffness: number; damping: number; mass: number }`
  - `RESORTES: Record<'pulsacion' | 'elevacion' | 'odometro' | 'trazado', Resorte>`
  - `RESORTE_PULSACION`, `RESORTE_ELEVACION`, `RESORTE_ODOMETRO`, `RESORTE_TRAZADO: Resorte`
  - `ESCALA_PULSADA: number`
  - `amortiguacionRelativa(r: Resorte): number`
  - `useMenosMovimiento(): boolean` (en `fisica.ts`)

- [ ] **Step 1: Crear el repositorio y el primer commit**

```bash
git init
git add -A
git commit -m "chore: estado al cerrar la Fase 5

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git checkout -b fase-6-fisica
```

- [ ] **Step 2: Instalar Motion y los tipos de Node**

`@types/node` hace falta porque los tests nuevos importan `node:test` desde archivos `.ts` que entran en `tsc --noEmit`.

```bash
npm install motion@^12.43.0
npm install -D @types/node
```

- [ ] **Step 3: Permitir tests en TypeScript**

Node 24 ejecuta `.ts` sin transpilar, así que no hace falta vitest. Dos ajustes para que `tsc` acepte los imports con extensión `.ts` que Node exige.

En `tsconfig.json`, dentro de `compilerOptions`:

```json
    "types": ["vite/client", "node"],
    "allowImportingTsExtensions": true,
```

En `package.json`, sustituir el script `test`:

```json
    "test": "node --test \"scripts/*.test.js\" \"src/**/*.test.ts\"",
```

- [ ] **Step 4: Escribir el test que falla**

Se prueba la invariante que de verdad importa de un muelle: que esté en la banda utilizable. Por debajo de ζ≈0.4 oscila como gelatina; por encima de 1.1 está muerto y no se distingue de un `ease-out`.

`src/animation/resortes.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { amortiguacionRelativa, RESORTES } from './resortes.ts';

test('todos los resortes caen en la banda utilizable', () => {
  for (const [nombre, resorte] of Object.entries(RESORTES)) {
    const z = amortiguacionRelativa(resorte);
    assert.ok(z >= 0.4 && z <= 1.1, `${nombre}: ζ=${z.toFixed(2)} fuera de [0.4, 1.1]`);
  }
});

test('la pulsación se recupera antes que el trazado se asienta', () => {
  // Frecuencia natural: a mayor rigidez y menor masa, antes acaba.
  const rapidez = (r: { stiffness: number; mass: number }) => Math.sqrt(r.stiffness / r.mass);
  assert.ok(rapidez(RESORTES.pulsacion) > rapidez(RESORTES.trazado));
});
```

- [ ] **Step 5: Ejecutar el test y verlo fallar**

Run: `npm test`
Expected: FAIL — `Cannot find module ... resortes.ts`

- [ ] **Step 6: Implementar los resortes**

`src/animation/resortes.ts`:

```ts
/**
 * Constantes de resorte de la Fase 6.
 *
 * Es al movimiento lo que `@theme` de theme.css es al color: el único sitio
 * donde viven estos números. Un componente que escriba su propia rigidez rompe
 * la coherencia de la elevación, que es justo lo que la fase venía a arreglar.
 *
 * Módulo puro a propósito —sin React, sin Motion—: así lo puede ejecutar
 * `node --test` sin arrastrar el DOM.
 */
export interface Resorte {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass: number;
}

const resorte = (stiffness: number, damping: number, mass = 1): Resorte => ({
  type: 'spring',
  stiffness,
  damping,
  mass,
});

export const RESORTES = {
  /** Hundimiento y recuperación de controles: rápido, con un rebote corto. */
  pulsacion: resorte(420, 26),
  /** Hover y foco de filas, sombra del panel, asentamiento de la hoja. */
  elevacion: resorte(320, 30),
  /** Muelle que arrastra el valor del odómetro. */
  odometro: resorte(180, 26),
  /** Trazado de firma: lento, con peso y un rebote perceptible al cerrar. */
  trazado: resorte(90, 14, 1.2),
} satisfies Record<string, Resorte>;

export const RESORTE_PULSACION = RESORTES.pulsacion;
export const RESORTE_ELEVACION = RESORTES.elevacion;
export const RESORTE_ODOMETRO = RESORTES.odometro;
export const RESORTE_TRAZADO = RESORTES.trazado;

/** Cuánto se hunde un control al pulsarlo. */
export const ESCALA_PULSADA = 0.97;

/**
 * ζ = c / (2·√(k·m)). Por debajo de 1 el muelle rebota; por encima llega
 * arrastrándose. Todo lo de esta fase vive por debajo de 1 y por encima de 0.4.
 */
export function amortiguacionRelativa({ stiffness, damping, mass }: Resorte): number {
  return damping / (2 * Math.sqrt(stiffness * mass));
}
```

- [ ] **Step 7: Ejecutar los tests y verlos pasar**

Run: `npm test`
Expected: PASS — los tests nuevos y los de `scripts/` que ya existían

- [ ] **Step 8: Envolver `useReducedMotion`**

`src/animation/fisica.ts`:

```ts
import { useReducedMotion } from 'motion/react';

/**
 * ¿El sistema pide menos movimiento?
 *
 * Existe como función propia porque el bloque `@media (prefers-reduced-motion)`
 * de theme.css solo apaga transiciones y animaciones CSS: las animaciones que
 * Motion calcula en JS se le escapan por completo. Todo lo que anima esta fase
 * pasa por aquí o no está protegido.
 */
export function useMenosMovimiento(): boolean {
  return useReducedMotion() ?? false;
}
```

- [ ] **Step 9: Crear el banco de pruebas vacío**

`src/lab/Fase6Lab.tsx`:

```tsx
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
```

- [ ] **Step 10: Montarlo tras `?lab`**

En `src/main.tsx`, sustituir el render:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/theme.css';
import App from './App';
import { Fase6Lab } from './lab/Fase6Lab';

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Falta #root en index.html');

/** Banco de pruebas de la Fase 6: temporal, se va al cerrar la fase. */
const banco = new URLSearchParams(window.location.search).has('lab');

createRoot(raiz).render(<StrictMode>{banco ? <Fase6Lab /> : <App />}</StrictMode>);
```

- [ ] **Step 11: Verificar en el navegador**

Run: `npm run dev`
- `http://localhost:5173/` → la aplicación de la Fase 5, igual que antes.
- `http://localhost:5173/?lab` → "Banco · Fase 6".

Run: `npm run build`
Expected: sin errores de `tsc`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(fase6): capa de física, Motion y banco de pruebas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Odómetro — la aritmética de las ruedas

Toda la lógica del odómetro que no necesita DOM, aislada y probada. Sin esto, la mecánica se acabaría depurando a ojo dentro de un componente animado.

**Files:**
- Create: `src/animation/odometro.ts`
- Create: `src/animation/odometro.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type Columna = { tipo: 'digito'; peso: number } | { tipo: 'fijo'; texto: string }`
  - `columnasDe(valor: number): Columna[]`
  - `formatear(valor: number): string`
  - `enVentana(posicion: number): number`
  - `digitoDe(valor: number, peso: number): number`
  - `pasoCorto(desde: number, hasta: number): number`
  - `ALTURAS_TAMBOR: number` (11)

- [ ] **Step 1: Escribir los tests que fallan**

`src/animation/odometro.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { columnasDe, digitoDe, enVentana, pasoCorto } from './odometro.ts';

test('una cifra de cuatro dígitos no lleva separador en es-ES', () => {
  // Intl agrupa a partir de cinco: 1004 va junto, 10.004 no.
  assert.deepEqual(
    columnasDe(1004),
    [
      { tipo: 'digito', peso: 1000 },
      { tipo: 'digito', peso: 100 },
      { tipo: 'digito', peso: 10 },
      { tipo: 'digito', peso: 1 },
    ],
  );
});

test('el separador de millar es una columna fija', () => {
  assert.deepEqual(
    columnasDe(42839),
    [
      { tipo: 'digito', peso: 10000 },
      { tipo: 'digito', peso: 1000 },
      { tipo: 'fijo', texto: '.' },
      { tipo: 'digito', peso: 100 },
      { tipo: 'digito', peso: 10 },
      { tipo: 'digito', peso: 1 },
    ],
  );
});

test('el cero ocupa una columna', () => {
  assert.deepEqual(columnasDe(0), [{ tipo: 'digito', peso: 1 }]);
});

test('la ventana del tambor va de 0 a 10, también con posiciones negativas', () => {
  assert.equal(enVentana(3.5), 3.5);
  assert.equal(Number(enVentana(23).toFixed(6)), 3);
  assert.equal(Number(enVentana(-0.3).toFixed(6)), 9.7);
});

test('cada columna lee su propio dígito del valor', () => {
  assert.equal(digitoDe(42839, 1), 9);
  assert.equal(digitoDe(42839, 100), 8);
  assert.equal(digitoDe(42839, 10000), 4);
  assert.equal(digitoDe(7, 10), 0);
});

test('la rueda cierra: de 9 a 0 es un paso adelante, no nueve atrás', () => {
  assert.equal(pasoCorto(9, 0), 1);
  assert.equal(pasoCorto(0, 9), -1);
  assert.equal(pasoCorto(3, 3), 0);
  assert.equal(pasoCorto(2, 7), 5);
  // Empate a cinco pasos: se resuelve siempre hacia delante, para que dos
  // columnas con el mismo salto no giren en sentidos contrarios.
  assert.equal(pasoCorto(7, 2), 5);
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `npm test`
Expected: FAIL — `Cannot find module ... odometro.ts`

- [ ] **Step 3: Implementar**

`src/animation/odometro.ts`:

```ts
/**
 * Aritmética del odómetro. Sin React y sin DOM: la mecánica de un
 * cuentakilómetros se puede razonar con números, y depurarla dentro de un
 * componente que además está animándose es la peor forma de hacerlo.
 */

/** Una columna del contador: o rueda un dígito, o es un carácter que no se mueve. */
export type Columna = { tipo: 'digito'; peso: number } | { tipo: 'fijo'; texto: string };

/** Alturas apiladas en cada tambor: 0..9 más un 0 de cierre para que la vuelta no salte. */
export const ALTURAS_TAMBOR = 11;

const nf = new Intl.NumberFormat('es-ES');

export function formatear(valor: number): string {
  return nf.format(Math.max(0, Math.trunc(valor)));
}

/**
 * Columnas de izquierda a derecha. `peso` es la potencia de diez que rueda en
 * esa columna: 1 las unidades, 10 las decenas, y así.
 */
export function columnasDe(valor: number): Columna[] {
  const texto = formatear(valor);
  let restantes = 0;
  for (const caracter of texto) if (caracter >= '0' && caracter <= '9') restantes += 1;

  return [...texto].map((caracter) => {
    if (caracter < '0' || caracter > '9') return { tipo: 'fijo', texto: caracter };
    restantes -= 1;
    return { tipo: 'digito', peso: 10 ** restantes };
  });
}

/**
 * Parte de la posición que asoma por la ventana del tambor: 0 ≤ x < 10.
 *
 * El resto de JavaScript conserva el signo (`-0.3 % 10` es `-0.3`), y una
 * posición negativa aparece en cuanto el muelle se pasa de frenada.
 */
export function enVentana(posicion: number): number {
  return ((posicion % 10) + 10) % 10;
}

/** El dígito que le toca a una columna para un valor dado. */
export function digitoDe(valor: number, peso: number): number {
  return Math.floor(Math.abs(Math.trunc(valor)) / peso) % 10;
}

/**
 * Paso más corto entre dos dígitos contando que la rueda cierra: de 9 a 0 se va
 * hacia delante. El empate (cinco pasos por cada lado) se resuelve hacia
 * delante siempre, para que dos columnas con el mismo salto no giren en
 * sentidos contrarios y parezca una avería.
 */
export function pasoCorto(desde: number, hasta: number): number {
  const adelante = ((hasta - desde) % 10 + 10) % 10;
  return adelante > 5 ? adelante - 10 : adelante;
}
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `npm test`
Expected: PASS — 6 tests nuevos

- [ ] **Step 5: Commit**

```bash
git add src/animation/odometro.ts src/animation/odometro.test.ts
git commit -m "feat(fase6): aritmética del odómetro

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: `<Odometro>` y las dos mecánicas en el banco

**Files:**
- Create: `src/animation/Odometro.tsx`
- Modify: `src/lab/Fase6Lab.tsx`

**Interfaces:**
- Consumes: `columnasDe`, `formatear`, `enVentana`, `digitoDe`, `pasoCorto`, `ALTURAS_TAMBOR` (Task 2); `RESORTE_ODOMETRO` (Task 1); `useMenosMovimiento` (Task 1).
- Produces:
  - `type Mecanica = 'rueda' | 'columna'`
  - `<Odometro valor={number | null} mecanica={Mecanica} className?={string} />`

**Nota de implementación.** El tambor no se mide en píxeles: es una tira de 11 glifos colocada en absoluto, y se desplaza con un porcentaje de su propia altura (`-posición · 100/11`). Así no hay que observar el tamaño del texto ni esperar a que carguen las tipografías. El glifo 11 es otro `0`: cuando la rueda pasa de 9.99 a 0 el salto de coordenada cae entre dos ceros idénticos y no se ve.

**Dónde se separan las dos mecánicas, y hay que mirarlo en la revisión.** Al ganar un dígito (999 → 1004) aparece una columna nueva. Con la mecánica de rueda entra rodando sola, sin código extra: su posición sale de dividir el valor suavizado por su peso, que en ese momento vale 0,999, así que la columna nace mostrando un `0` a punto de girar al `1`. Con la mecánica por columna nace ya con su dígito puesto, porque su posición se inicializa en el destino: la columna aparece de golpe. Igualarlas obligaría a distinguir una columna recién nacida de una que ya estaba —y a no hacerlo en el primer render, o el contador giraría desde cero al cargar la página—. No se hace ahora: si en la Tarea 6 gana la mecánica por columna, se añade entonces y solo entonces.

- [ ] **Step 1: Escribir el componente**

`src/animation/Odometro.tsx`:

```tsx
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
```

- [ ] **Step 2: Montar la comparativa en el banco**

Sustituir el cuerpo de `Fase6Lab` en `src/lab/Fase6Lab.tsx` (conservando `Banco`):

```tsx
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Odometro } from '../animation/Odometro';

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
```

- [ ] **Step 3: Verificar en el navegador**

Run: `npm run dev` y abrir `http://localhost:5173/?lab`

Comprobar y anotar:
- Las dos mecánicas ruedan y acaban en la misma cifra.
- Ni una ni otra desalinea las columnas (los glifos no se salen de su ventana).
- Al arrastrar el slider los dígitos ruedan de forma continua y al soltar se asientan sin salto.
- 999 → 1004 (botón «999» y luego «+7» cinco veces): la columna nueva entra sin descolocar las demás. Comparar cómo aparece en cada mecánica — con rueda entra girando, con columna aparece puesta.
- Con `prefers-reduced-motion` activo (DevTools → Rendering → Emulate CSS media feature) la cifra cambia en seco, sin tambores.

- [ ] **Step 4: Comprobar que el tipado sigue limpio**

Run: `npm run build`
Expected: sin errores

- [ ] **Step 5: Commit**

```bash
git add src/animation/Odometro.tsx src/lab/Fase6Lab.tsx
git commit -m "feat(fase6): componente Odómetro con las dos mecánicas a comparar

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Elevación y `<Pulsable>`

**Files:**
- Modify: `src/styles/theme.css`
- Create: `src/animation/elevacion.ts`
- Create: `src/animation/Pulsable.tsx`
- Modify: `src/lab/Fase6Lab.tsx`

**Interfaces:**
- Consumes: `RESORTE_PULSACION`, `RESORTE_ELEVACION`, `ESCALA_PULSADA`, `useMenosMovimiento`.
- Produces:
  - `interface Sombras { apoyo: string; alta: string; mano: string }`
  - `leerSombras(): Sombras`
  - `useSombras(): Sombras`
  - `<Pulsable elevado?={boolean} ...props de button />`

**Nota.** Las sombras se declaran en `theme.css` con el prefijo `--shadow-`, que es el espacio de nombres de Tailwind 4: además de existir como variable, generan las utilidades `shadow-apoyo`, `shadow-alta` y `shadow-mano` para los usos estáticos. El JS las lee con `getComputedStyle`, el mismo camino que ya usa `leerPaleta()` para que los valores vivan solo en el CSS. Van en `rgba()` literal y no en `color-mix()`: Motion no sabe interpolar entre dos `color-mix`.

- [ ] **Step 1: Añadir la escala de elevación a `theme.css`**

Dentro del bloque `@theme`, tras los tiempos:

```css
  /* Elevación (Fase 6). Tres alturas y ninguna más: apoyado en la mesa,
     levantado por el cursor, y en la mano (la hoja mientras se arrastra).
     En rgba() literal: Motion no interpola entre dos color-mix(). */
  --shadow-apoyo: 0 1px 2px -1px rgba(27, 33, 29, 0.16);
  --shadow-alta: 0 4px 12px -5px rgba(27, 33, 29, 0.42);
  --shadow-mano: 0 -8px 26px -12px rgba(27, 33, 29, 0.55);
```

- [ ] **Step 2: Leer las sombras desde JS**

`src/animation/elevacion.ts`:

```ts
import { useMemo } from 'react';

/**
 * Las tres alturas de la fase, leídas de theme.css.
 *
 * Mismo motivo que `leerPaleta()`: los valores viven en el CSS y el JS los lee
 * ya resueltos, porque Motion necesita una cadena literal que interpolar y
 * `var(--x)` dentro de un box-shadow animado no se resuelve.
 */
export interface Sombras {
  apoyo: string;
  alta: string;
  mano: string;
}

let cache: Sombras | null = null;

/** Debe llamarse con el CSS ya aplicado (en render), nunca en el módulo. */
export function leerSombras(): Sombras {
  if (cache) return cache;
  const estilo = getComputedStyle(document.documentElement);
  cache = {
    apoyo: estilo.getPropertyValue('--shadow-apoyo').trim(),
    alta: estilo.getPropertyValue('--shadow-alta').trim(),
    mano: estilo.getPropertyValue('--shadow-mano').trim(),
  };
  return cache;
}

export function useSombras(): Sombras {
  return useMemo(leerSombras, []);
}
```

- [ ] **Step 3: Escribir `<Pulsable>`**

`src/animation/Pulsable.tsx`:

```tsx
import { motion } from 'motion/react';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { useSombras } from './elevacion';
import { useMenosMovimiento } from './fisica';
import { ESCALA_PULSADA, RESORTE_ELEVACION, RESORTE_PULSACION } from './resortes';

/** Motion se queda con estos nombres para sus propios gestos. */
type PropsBoton = Omit<
  ComponentProps<'button'>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'style' | 'ref'
>;

interface Props extends PropsBoton {
  /**
   * ¿El control está elevado en reposo? Solo entonces tiene sentido que la
   * sombra se comprima al pulsar. A un control plano habría que inventarle una
   * elevación para poder quitársela, y entonces flotaría media interfaz.
   */
  elevado?: boolean;
  children: ReactNode;
}

/**
 * Control con física: se hunde al pulsarlo y vuelve con resorte, no con una
 * transición. La diferencia se nota al pulsar dos veces seguidas —el muelle
 * reanuda desde la velocidad que llevaba en vez de reiniciar en seco— y es toda
 * la razón de que esto no sea un `:active` de CSS.
 */
export function Pulsable({ elevado = false, children, ...resto }: Props) {
  const quieto = useMenosMovimiento();
  const sombras = useSombras();
  const [realzado, setRealzado] = useState(false);

  if (quieto) {
    return <button {...resto}>{children}</button>;
  }

  return (
    <motion.button
      {...resto}
      onHoverStart={() => setRealzado(true)}
      onHoverEnd={() => setRealzado(false)}
      // `:focus-visible` y no `onFocus` a secas: el foco que deja un clic del
      // ratón no debe levantar nada, solo el que llega con el tabulador.
      onFocus={(e) => setRealzado(e.currentTarget.matches(':focus-visible'))}
      onBlur={() => setRealzado(false)}
      animate={
        elevado
          ? { y: realzado ? -1 : 0, boxShadow: realzado ? sombras.alta : sombras.apoyo }
          : undefined
      }
      whileTap={
        elevado
          ? { scale: ESCALA_PULSADA, y: 0, boxShadow: sombras.apoyo }
          : { scale: ESCALA_PULSADA }
      }
      transition={{ default: RESORTE_ELEVACION, scale: RESORTE_PULSACION }}
    >
      {children}
    </motion.button>
  );
}
```

- [ ] **Step 4: Añadir la sección al banco**

En `src/lab/Fase6Lab.tsx`, importar `Pulsable` y añadir tras la sección del odómetro:

```tsx
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
          <Pulsable type="button" className="text-caption text-panel underline-offset-2 hover:underline">
            Control plano (breadcrumb)
          </Pulsable>
          <Pulsable type="button" className="text-caption text-asfalto hover:text-ink">
            Cabecera de orden
          </Pulsable>
        </div>
      </Banco>
```

- [ ] **Step 5: Verificar en el navegador**

Run: `npm run dev` y abrir `http://localhost:5173/?lab`

Comprobar:
- La fila se hunde al pulsar y vuelve con inercia; pulsando rápido dos veces el movimiento no se reinicia en seco.
- Hover y tabulador levantan la fila igual; el clic del ratón no la deja levantada al soltar.
- Los controles planos se hunden pero no proyectan sombra.
- El anillo de foco sigue visible sobre la fila elevada.
- Con `prefers-reduced-motion` no hay hundimiento ni elevación.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(fase6): escala de elevación y control Pulsable

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Trazado de firma con peso

Se hace sobre el componente real y no sobre una maqueta: el trazado solo tiene sentido sobre el perímetro de una provincia de verdad, y verlo en la aplicación es más barato que fabricar un `<path>` de mentira.

**Files:**
- Modify: `src/components/map/RouteTraceOverlay.tsx`

**Interfaces:**
- Consumes: `RESORTE_TRAZADO`.
- Produces: nada nuevo.

**Nota de implementación — esto es lo que más fácil se hace mal.** Un muelle aplicado directamente a `stroke-dashoffset` deja el offset en negativo al pasarse de frenada, y entonces el hueco no aparece al final del trazo sino **al principio**: la línea se despega de su punto de arranque y parece un error de dibujo. Por eso el muelle mueve un progreso acotado en 1. El primer sobrepaso queda tapado por el tope —el trazo llega al cierre a toda velocidad y se para en seco, como una punta contra un tope— y el rebote que se ve es la oscilación siguiente, cuando el progreso baja de 1 y la cabeza del trazo retrocede unos píxeles antes de cerrar.

- [ ] **Step 1: Sustituir la transición CSS por el muelle**

En `src/components/map/RouteTraceOverlay.tsx`, cambiar el import y la constante de duración:

```tsx
import { animate } from 'motion/react';
import type { Polygon as CapaPoligono } from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Polygon, useMap } from 'react-leaflet';

import type { FeatureRegion } from '../../types/geo';
import { RESORTE_TRAZADO } from '../../animation/resortes';
import { anillosDe } from '../../utils/cartografia';

/** Grosor en reposo del trazo, y el pulso con el que se asienta. */
const GROSOR = 2.5;
const GROSOR_PULSO = 2.9;
/** Por encima de las capas de regiones (400) y por debajo de los rótulos (600). */
const PANEL = 'trazado';
```

Y sustituir el segundo `useEffect` completo por:

```tsx
  // Depende de `panelListo` a propósito: hasta que el panel no existe no se
  // monta el <Polygon>, y sin polígono no hay <path> que animar.
  useEffect(() => {
    if (!panelListo) return;
    const path = borde.current?.getElement() as SVGPathElement | null | undefined;
    if (!path) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const largo = path.getTotalLength();
    path.style.strokeDasharray = String(largo);
    path.style.strokeDashoffset = String(largo);

    // El muelle mueve un progreso, no el offset. Acotado en 1: el sobrepaso se
    // come contra el tope —la punta llega al cierre y se para en seco— y lo que
    // se ve del rebote es el retroceso siguiente, en la cabeza del trazo. Un
    // muelle sobre el offset a pelo dejaría el hueco en el arranque de la
    // línea, que se lee como un fallo de dibujo y no como peso.
    const trazo = animate(0, 1, {
      ...RESORTE_TRAZADO,
      onUpdate: (p) => {
        path.style.strokeDashoffset = String(largo * (1 - Math.min(1, p)));
      },
    });

    // El peso de la línea al detenerse: engorda y vuelve.
    const pulso = animate(
      path,
      { strokeWidth: [GROSOR, GROSOR_PULSO, GROSOR] },
      { duration: 0.34, delay: 0.28, ease: 'easeOut' },
    );

    void trazo.finished.then(() => {
      // Sin dasharray el borde vuelve a ser una línea continua normal: si el
      // usuario hace zoom después, no se queda un rastro de guiones descuadrados.
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
    });

    return () => {
      trazo.stop();
      pulso.stop();
      path.style.strokeWidth = '';
    };
  }, [panelListo]);
```

- [ ] **Step 2: Verificar en el navegador**

Run: `npm run dev` y abrir `http://localhost:5173/`

Comprobar en varias provincias (una de perímetro largo como Cáceres y una corta como Álava):
- El trazo recorre el borde, cierra, retrocede un poco y se asienta.
- **En ningún momento aparece un hueco en el punto de arranque.**
- Al hacer zoom después, el borde es una línea continua sin guiones.
- Con `prefers-reduced-motion` no hay trazado, igual que antes.

- [ ] **Step 3: Commit**

```bash
git add src/components/map/RouteTraceOverlay.tsx
git commit -m "feat(fase6): el trazado de firma se asienta con resorte y pulso de grosor

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: PARADA — revisión con el usuario

No es una tarea de código. Es el compromiso del enunciado: enseñar dos o tres piezas antes de repartir la física por toda la interfaz.

- [ ] **Step 1: Dejar la aplicación levantada**

Run: `npm run dev`

- [ ] **Step 2: Enseñar y pedir decisión**

Enseñar `?lab` (odómetro en las dos mecánicas, pulsación) y la aplicación real (trazado con peso). Pedir:

1. **Mecánica de odómetro: `rueda` o `columna`.** La perdedora se borra en la Tarea 7; no queda como opción configurable.
2. Ajuste de rigidez o amortiguación, si algo se siente pesado o nervioso. Los valores cambian en un solo sitio: `src/animation/resortes.ts`.
3. Visto bueno a la pulsación con sombra en filas y sin sombra en controles planos.

- [ ] **Step 3: Anotar la decisión en el plan**

Escribir la mecánica elegida y los valores acordados aquí mismo, antes de seguir. Las tareas 7 a 12 dependen de ello.

---

### Task 7: Aplicar el odómetro a los dos contadores

**Files:**
- Modify: `src/animation/Odometro.tsx`
- Modify: `src/components/layout/StatsCounter.tsx`
- Modify: `src/components/sidebar/Sidebar.tsx`

**Interfaces:**
- Consumes: `<Odometro>` (Task 3).
- Produces: `<Odometro valor={number | null} className?={string} />` — sin `mecanica`.

- [ ] **Step 1: Borrar la mecánica perdedora**

En `src/animation/Odometro.tsx`: eliminar el tipo `Mecanica`, la prop, la rama del `map` y el componente de tambor que no se haya elegido. Si gana `rueda`, se van `TamborColumna`, `ESCALON`, `pasoCorto` y `digitoDe` del import; si gana `columna`, se van `TamborRueda`, `useSpring` y el `MotionValue` compartido.

Después, quitar de `src/animation/odometro.ts` las funciones que hayan quedado sin uso y sus tests (`noUnusedLocals` no avisa de exports huérfanos, así que hay que mirarlo a mano).

Run: `npm test && npm run build`
Expected: PASS y sin errores

- [ ] **Step 2: Contador nacional**

En `src/components/layout/StatsCounter.tsx`, sustituir la cifra:

```tsx
import { Odometro } from '../../animation/Odometro';

interface Props {
  /** Ámbito del recuento: "España" hoy, la región activa a partir de la Fase 3. */
  ambito: string;
  total: number | null;
}

/**
 * Contador siempre visible. La cifra en monoespaciada, como todo dato de tabla,
 * y rodando como un cuentakilómetros al cambiar el umbral.
 *
 * En móvil el ámbito se lee pero no se ve: en 390 px compite con el título por
 * la misma línea, y el título ya dice "de España". Va con `sr-only` y no
 * `hidden` para que quien navega con lector de pantalla no pierda de qué
 * territorio es la cifra.
 */
export function StatsCounter({ ambito, total }: Props) {
  return (
    <p className="flex shrink-0 items-baseline gap-2" aria-live="polite">
      <span className="text-body-sm text-asfalto max-sm:sr-only">{ambito}</span>
      <span aria-hidden="true" className="text-asfalto/60 max-sm:hidden">
        ·
      </span>
      <Odometro
        valor={total}
        className="font-mono text-body font-medium tabular-nums lg:text-label-lg"
      />
      <span className="text-body-sm text-asfalto">empresas</span>
    </p>
  );
}
```

Se borra el `Intl.NumberFormat` local: ahora formatea `Odometro`.

- [ ] **Step 3: Cifra de la región activa**

En `src/components/sidebar/Sidebar.tsx`, dentro del asomo, sustituir:

```tsx
            <p
              className="shrink-0 font-mono text-body-sm tabular-nums text-asfalto"
              aria-live="polite"
            >
              <Odometro valor={conteo === null ? null : conteo.cumplen} />
              <span className="ml-1.5 font-sans text-caption">
                {umbral === 0 ? 'con dato' : `≥ ${umbral} empl.`}
              </span>
            </p>
```

Añadir el import `import { Odometro } from '../../animation/Odometro';`. El `nf` del módulo sigue haciendo falta si lo usa algo más; si no, se borra.

- [ ] **Step 4: Verificar en el navegador**

Run: `npm run dev`

- Mover el slider de umbral: los dos contadores ruedan de forma continua y se asientan al soltar.
- Navegar España → comunidad → provincia: la cifra del panel rueda; **las cifras sobre el mapa cambian en seco** (es lo acordado).
- Con VoiceOver/NVDA o el árbol de accesibilidad de DevTools: el contador expone una sola cifra, no las columnas.
- Con `prefers-reduced-motion`: cambio instantáneo.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(fase6): contadores nacional y de región con odómetro

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Aplicar la pulsación a los controles

**Files:**
- Modify: `src/components/sidebar/RegionList.tsx`
- Modify: `src/components/sidebar/Breadcrumb.tsx`
- Modify: `src/components/sidebar/CompanyListHeader.tsx`
- Modify: `src/components/sidebar/SearchBox.tsx`
- Modify: `src/components/sidebar/SheetHandle.tsx`

**Interfaces:**
- Consumes: `<Pulsable>` (Task 4).
- Produces: nada nuevo.

`CompanyRow` no se toca: no es pulsable y darle afordancia sería prometer una acción que no existe.

- [ ] **Step 1: Filas de región (con sombra)**

En `src/components/sidebar/RegionList.tsx`, sustituir el `<button>` por `<Pulsable elevado>` y añadir `bg-base` (una sombra sobre un fondo transparente se vería a través de la fila de abajo):

```tsx
import { Pulsable } from '../../animation/Pulsable';

// …

        <li key={region.cod}>
          <Pulsable
            elevado
            type="button"
            onClick={() => onSeleccionar(region.cod)}
            className="flex w-full items-baseline justify-between gap-3 border-b border-asfalto/25 bg-base px-4 py-2.5 text-left transition-colors duration-150 hover:bg-atencion/12"
          >
            <span className="truncate text-body-sm">{region.nombre}</span>
            <span className="shrink-0 font-mono text-body-sm tabular-nums text-asfalto">
              {nf.format(region.cumplen)}
            </span>
          </Pulsable>
        </li>
```

- [ ] **Step 2: Breadcrumb, cabeceras de orden y cruz de búsqueda (sin sombra)**

En los tres archivos, cambiar `<button type="button" …>` por `<Pulsable type="button" …>` conservando todas las props y clases tal cual. No llevan `elevado`.

- `src/components/sidebar/Breadcrumb.tsx`: solo el botón de los segmentos con `onVolver`. El segmento actual es un `<span aria-current="page">` y se queda como está.
- `src/components/sidebar/CompanyListHeader.tsx`: el `<button>` del componente interno `Columna`. Conservar `aria-pressed` y `title`.
- `src/components/sidebar/SearchBox.tsx`: el botón de la cruz.

- [ ] **Step 3: Asa de la hoja**

En `src/components/sidebar/SheetHandle.tsx`, cambiar `<button>` por `<Pulsable>` —sin `elevado`— conservando `{...hoja.gestoAsa}`, `aria-expanded`, `aria-controls`, `touch-none` y la clase `group`.

Sin `elevado` a propósito: el asa ocupa todo el ancho de la hoja y su sombra propia se leería como una franja atravesando el panel. La que está elevada es la hoja, y de eso se encarga la Tarea 10.

El asa captura el puntero para arrastrar la hoja; Motion cancela su gesto de pulsación cuando el puntero se aleja, así que el hundimiento desaparece al empezar a arrastrar. Es el comportamiento correcto, pero hay que verlo (paso siguiente).

- [ ] **Step 4: Verificar en el navegador**

Run: `npm run dev`

- Filas de región: se hunden al pulsar, navegan igual que antes, se elevan con hover y con tabulador.
- Breadcrumb: los segmentos navegables se hunden; el actual no reacciona.
- Cabeceras de orden: se hunden y el orden sigue cambiando, con `aria-pressed` correcto.
- Cruz de la búsqueda: se hunde y sigue vaciando el campo.
- En móvil (DevTools responsive, <1024 px): el asa se hunde al tocarla, y al arrastrar la hoja el hundimiento se suelta sin quedarse pegado. Enter y Espacio siguen desplegando y recogiendo.
- Nada de esto se mueve con `prefers-reduced-motion`.

Run: `npm run build`
Expected: sin errores

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(fase6): pulsación física en los controles que hacen algo

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Compresión al pulsar una provincia

**Files:**
- Create: `src/utils/color.ts`
- Create: `src/utils/color.test.ts`
- Modify: `src/components/map/ChoroplethLayer.tsx`

**Interfaces:**
- Consumes: `RESORTE_PULSACION`, `leerPaleta`, `pasoDe`.
- Produces: `mezclar(hexA: string, hexB: string, t: number): string` — `t=0` devuelve A, `t=1` devuelve B.

`mezclar` la usan dos sitios: aquí, para oscurecer el relleno al pulsar, y el mar de la Tarea 12, para precomponer la opacidad de cada isóbata sobre el fondo. Por eso vive en `utils` y no dentro del componente.

- [ ] **Step 1: Escribir los tests que fallan**

`src/utils/color.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mezclar } from './color.ts';

test('los extremos devuelven cada color tal cual', () => {
  assert.equal(mezclar('#0a6847', '#1b211d', 0), '#0a6847');
  assert.equal(mezclar('#0a6847', '#1b211d', 1), '#1b211d');
});

test('el punto medio de negro y blanco es el gris de en medio', () => {
  assert.equal(mezclar('#000000', '#ffffff', 0.5), '#808080');
});

test('la proporción se acota fuera de [0, 1]', () => {
  assert.equal(mezclar('#000000', '#ffffff', 2), '#ffffff');
  assert.equal(mezclar('#000000', '#ffffff', -1), '#000000');
});

test('acepta la forma corta de tres dígitos', () => {
  assert.equal(mezclar('#fff', '#000', 0), '#ffffff');
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `npm test`
Expected: FAIL — `Cannot find module ... color.ts`

- [ ] **Step 3: Implementar**

`src/utils/color.ts`:

```ts
/**
 * Mezcla de dos colores hexadecimales.
 *
 * Existe porque hay dos sitios donde el color hay que resolverlo en JS y no en
 * CSS: el relleno que se comprime al pulsar una provincia (Motion necesita un
 * valor literal que interpolar) y las isóbatas del mar (van a un canvas, que no
 * entiende `color-mix`). Los hex siguen viviendo solo en theme.css; aquí solo
 * se combinan.
 */

function componentes(hex: string): [number, number, number] {
  const limpio = hex.trim().replace('#', '');
  const largo =
    limpio.length === 3
      ? limpio
          .split('')
          .map((c) => c + c)
          .join('')
      : limpio;
  const valor = Number.parseInt(largo, 16);
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255];
}

const aDos = (n: number) => n.toString(16).padStart(2, '0');

/** `t = 0` devuelve A, `t = 1` devuelve B. Fuera de ese rango se acota. */
export function mezclar(hexA: string, hexB: string, t: number): string {
  const p = Math.min(1, Math.max(0, t));
  const a = componentes(hexA);
  const b = componentes(hexB);
  const canal = (i: 0 | 1 | 2) => aDos(Math.round(a[i] + (b[i] - a[i]) * p));
  return `#${canal(0)}${canal(1)}${canal(2)}`;
}
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Comprimir la provincia al pulsar**

En `src/components/map/ChoroplethLayer.tsx`, añadir imports:

```tsx
import { animate } from 'motion/react';

import { RESORTE_PULSACION } from '../../animation/resortes';
import { mezclar } from '../../utils/color';
```

Y constantes junto a las que ya hay:

```tsx
/** Cuánto se oscurece el relleno de una región mientras se la tiene pulsada. */
const COMPRESION = 0.12;
/** Grosor del borde en reposo con el cursor encima, y pulsado. */
const BORDE_HOVER = 2.5;
const BORDE_PULSADO = 3.4;
```

Añadir a `eventHandlers`, junto a `click`, `mouseover` y `mouseout`:

```tsx
                // Una provincia no se puede encoger al pulsarla: se despegaría
                // de sus vecinas y mentiría sobre la geografía. La pulsación se
                // expresa donde sí es física en un mapa: el relleno se comprime
                // y el borde engorda.
                mousedown: (e: LeafletMouseEvent) => {
                  const cod = codigoDe(e.propagatedFrom);
                  const path = (e.propagatedFrom as Path).getElement() as SVGPathElement | null;
                  if (!cod || !path || quieto) return;
                  const relleno = paleta.relleno[pasos.get(cod) ?? 0];
                  animate(
                    path,
                    {
                      fill: mezclar(relleno, paleta.borde, COMPRESION),
                      strokeWidth: BORDE_PULSADO,
                    },
                    RESORTE_PULSACION,
                  );
                },
                mouseup: (e: LeafletMouseEvent) => {
                  const cod = codigoDe(e.propagatedFrom);
                  const path = (e.propagatedFrom as Path).getElement() as SVGPathElement | null;
                  if (!cod || !path || quieto) return;
                  const relleno = paleta.relleno[pasos.get(cod) ?? 0];
                  const vuelta = animate(
                    path,
                    { fill: relleno, strokeWidth: BORDE_HOVER },
                    RESORTE_PULSACION,
                  );
                  // Al acabar se quitan los estilos en línea: si se quedaran,
                  // ganarían al atributo que escribe `setStyle` y la región no
                  // volvería a cambiar de color al mover el umbral.
                  void vuelta.finished.then(() => {
                    path.style.fill = '';
                    path.style.strokeWidth = '';
                  });
                },
```

Y sustituir el `mouseout` que ya existe: si se pulsa una región y se suelta el ratón fuera, el `mouseup` no llega nunca y la región se quedaría oscura para siempre. Además los estilos en línea ganan al atributo que escribe `setStyle`, así que hay que borrarlos aquí también o la región deja de responder al umbral.

```tsx
                mouseout: (e: LeafletMouseEvent) => {
                  const cod = codigoDe(e.propagatedFrom);
                  if (!cod) return;
                  const path = (e.propagatedFrom as Path).getElement() as SVGPathElement | null;
                  // Salir con el botón pulsado deja la compresión a medias: el
                  // `mouseup` se lo lleva otro elemento y aquí no vuelve nadie.
                  if (path) {
                    path.style.fill = '';
                    path.style.strokeWidth = '';
                  }
                  (e.propagatedFrom as Path).setStyle(estiloDe(pasos.get(cod) ?? 0));
                },
```

`quieto` sale de un `useMenosMovimiento()` añadido al principio del componente:

```tsx
  const quieto = useMenosMovimiento();
```

con `import { useMenosMovimiento } from '../../animation/fisica';`.

- [ ] **Step 6: Verificar en el navegador**

Run: `npm run dev`

- Mantener pulsada una comunidad: el relleno se oscurece y el borde engorda, con inercia.
- Al soltar: vuelve y **arranca el trazado de firma** de la Tarea 5.
- Pulsar y arrastrar fuera de la región antes de soltar: la región vuelve a su color, no se queda oscura.
- Mover el umbral después de haber pulsado una región: esa región vuelve a cambiar de color con las demás (esto verifica la limpieza de estilos en línea).
- En móvil: el toque sobre una provincia navega igual que antes.
- Con `prefers-reduced-motion`: no hay compresión.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(fase6): las provincias se comprimen al pulsarlas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Elevación de la hoja y del panel de escritorio

**Files:**
- Modify: `src/hooks/useBottomSheet.ts`
- Modify: `src/components/sidebar/Sidebar.tsx`

**Interfaces:**
- Consumes: `RESORTE_ELEVACION`, `useSombras`, `useMenosMovimiento`.
- Produces: `Hoja` gana un campo `oculto: number` — píxeles que la hoja puede bajar (0 = no hay nada que ocultar).

- [ ] **Step 1: Exponer el recorrido de la hoja**

En `src/hooks/useBottomSheet.ts`, añadir a la interfaz `Hoja`:

```ts
  /** Recorrido total de la hoja. Sirve para saber cuánto está levantada. */
  oculto: number;
```

y al objeto devuelto, junto a `asomo`:

```ts
    oculto,
```

- [ ] **Step 2: La hoja se asienta con resorte y su sombra crece**

En `src/components/sidebar/Sidebar.tsx`, convertir el `<aside>` en `motion.aside`:

```tsx
import { motion } from 'motion/react';

import { useSombras } from '../../animation/elevacion';
import { useMenosMovimiento } from '../../animation/fisica';
import { RESORTE_ELEVACION } from '../../animation/resortes';
```

Dentro del componente, antes del `return`:

```tsx
  const sombras = useSombras();
  const quieto = useMenosMovimiento();
  /** 0 recogida, 1 desplegada del todo. La sombra crece con el levantamiento. */
  const levantada = hoja.oculto === 0 ? 1 : 1 - hoja.desplazamiento / hoja.oculto;
```

Y sustituir la apertura del elemento:

```tsx
    <motion.aside
      ref={hoja.refHoja}
      id={ID_PANEL}
      aria-label="Panel de consulta"
      animate={hoja.esHoja ? { y: hoja.desplazamiento } : { y: 0 }}
      // Con el dedo encima no puede haber muelle: la hoja sigue al pulgar.
      transition={hoja.arrastrando || quieto ? { duration: 0 } : RESORTE_ELEVACION}
      style={
        hoja.esHoja
          ? // La sombra crece con lo levantada que está: recogida está apoyada
            // en el borde de la pantalla, desplegada está en la mano.
            { boxShadow: levantada > 0.98 ? sombras.mano : sombras.apoyo }
          : undefined
      }
      className={[
        'fixed inset-x-0 bottom-0 z-[1200] flex h-[82dvh] min-h-0 w-full min-w-0 flex-col',
        'border-t border-asfalto bg-base',
        'lg:static lg:z-auto lg:h-auto lg:w-[34%] lg:min-w-[320px] lg:max-w-[420px] lg:shrink-0',
        // En escritorio el panel no aparece: está siempre. Su elevación es de
        // reposo —una sombra real en el canto en vez de una línea plana.
        'lg:border-l lg:border-t-0 lg:border-asfalto/40 lg:shadow-alta',
      ].join(' ')}
    >
```

Se van la clase `shadow-[0_-2px_14px_…]`, el `style` del `transform` y las clases de transición: ahora lo lleva Motion.

Cerrar con `</motion.aside>`.

**Nota:** `boxShadow` va en `style` y no en `animate` porque solo tiene dos alturas; si al verlo se quiere el crecimiento continuo, pasarlo a `animate` con `useTransform` sobre `levantada`. Decidirlo mirándolo, no antes.

- [ ] **Step 3: El contenido del panel entra al cambiar de región**

En el mismo archivo, envolver el cuerpo (el `<div inert={recogida} …>`) en un contenedor animado con `key`:

```tsx
      <motion.div
        key={`${vista.nivel}-${vista.nivel === 'nacional' ? '' : vista.ccaa}`}
        initial={quieto ? false : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={RESORTE_ELEVACION}
        inert={recogida}
        className="flex min-h-0 flex-1 flex-col"
      >
```

cerrando con `</motion.div>`. La `key` cambia solo al cambiar de comunidad o de nivel: si dependiera de la provincia, el panel entraría de nuevo cada vez que se cambia de provincia dentro de la misma comunidad, que es navegación fina y no un cambio de contexto.

- [ ] **Step 4: Verificar en el navegador**

Run: `npm run dev`

- Escritorio: el panel tiene sombra en el canto izquierdo; al cambiar de comunidad el contenido entra desde la derecha y se asienta.
- Móvil: arrastrar la hoja sigue al dedo sin retardo; al soltar se asienta con muelle, no con `ease-out`; la sombra es más profunda desplegada que recogida.
- El listado virtualizado sigue midiendo bien su altura (no se desborda sobre el pie) — es la regresión histórica de este componente, mirar expresamente.
- Escape recoge la hoja; el tabulador no entra en el cuerpo con la hoja recogida.
- Con `prefers-reduced-motion`: la hoja salta a su sitio y el contenido no se desplaza.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(fase6): elevación coherente en hoja y panel lateral

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: El mar como carta náutica

**Files:**
- Create: `src/utils/cartaNautica.ts`
- Create: `src/utils/cartaNautica.test.ts`
- Create: `src/components/map/SeaChartLayer.tsx`
- Modify: `src/components/map/SpainMap.tsx`

**Interfaces:**
- Consumes: `mezclar` (Task 9), `CCAA_GEO`, `leerPaleta`.
- Produces:
  - `interface Isobata { distancia: number; opacidad: number }`
  - `isobatas(n: number, opciones?: OpcionesIsobatas): Isobata[]`
  - `<SeaChartLayer />`

**Cómo funciona el dibujo.** No hace falta calcular curvas paralelas a la costa ni disolver los 19 polígonos en una silueta: se apilan trazos. Para cada nivel, de más lejano a más cercano, se pinta el conjunto de comunidades (relleno + trazo de grosor `2·distancia`) en el color de la línea y encima el mismo conjunto con grosor `2·(distancia − grosor)` en el color del fondo. Cada par deja un anillo fino a esa distancia exacta de la costa y borra todo lo que hay por dentro. Los límites interiores entre comunidades desaparecen solos porque los rellenos se solapan.

Las distancias van en píxeles de pantalla, no en grados: la densidad de las curvas se ve igual a cualquier zoom.

- [ ] **Step 1: Escribir los tests que fallan**

`src/utils/cartaNautica.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isobatas } from './cartaNautica.ts';

test('devuelve tantos niveles como se piden', () => {
  assert.equal(isobatas(7).length, 7);
});

test('las curvas se alejan de la costa y se van separando', () => {
  const curvas = isobatas(7);
  const huecos: number[] = [];
  for (let i = 1; i < curvas.length; i++) {
    const hueco = curvas[i]!.distancia - curvas[i - 1]!.distancia;
    assert.ok(hueco > 0, `la curva ${i} no se aleja`);
    huecos.push(hueco);
  }
  for (let i = 1; i < huecos.length; i++) {
    assert.ok(huecos[i]! > huecos[i - 1]!, `el hueco ${i} no crece`);
  }
});

test('la opacidad decrece hacia mar abierto y nunca se sale de la banda', () => {
  const curvas = isobatas(7, { opacidadMax: 0.09, opacidadMin: 0.02 });
  assert.equal(curvas[0]!.opacidad, 0.09);
  assert.equal(curvas[curvas.length - 1]!.opacidad, 0.02);
  for (let i = 1; i < curvas.length; i++) {
    assert.ok(curvas[i]!.opacidad < curvas[i - 1]!.opacidad);
  }
});

test('un solo nivel se queda con la opacidad máxima', () => {
  assert.deepEqual(isobatas(1, { separacion: 7, opacidadMax: 0.09 })[0], {
    distancia: 7,
    opacidad: 0.09,
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `npm test`
Expected: FAIL — `Cannot find module ... cartaNautica.ts`

- [ ] **Step 3: Implementar**

`src/utils/cartaNautica.ts`:

```ts
/**
 * Isóbatas del mar: las curvas de nivel que rodean la costa en una carta
 * náutica. Aquí no miden profundidad —no la tenemos ni hace falta—, solo dan al
 * fondo la materialidad de una carta impresa sin convertirse en un mapa base.
 *
 * En píxeles de pantalla y no en grados: así la densidad de las curvas se ve
 * igual a cualquier zoom, que es lo que hace que parezcan papel y no datos.
 */
export interface Isobata {
  /** Distancia a la costa, en píxeles. */
  distancia: number;
  opacidad: number;
}

export interface OpcionesIsobatas {
  /** Separación de la primera curva respecto a la costa. */
  separacion?: number;
  /** Cuánto se abre cada hueco respecto al anterior. */
  crecimiento?: number;
  opacidadMax?: number;
  opacidadMin?: number;
}

export function isobatas(
  n: number,
  {
    separacion = 7,
    crecimiento = 1.45,
    opacidadMax = 0.09,
    opacidadMin = 0.02,
  }: OpcionesIsobatas = {},
): Isobata[] {
  const curvas: Isobata[] = [];
  let distancia = 0;
  let hueco = separacion;

  for (let i = 0; i < n; i++) {
    distancia += hueco;
    hueco *= crecimiento;
    // Con un solo nivel no hay degradado que repartir: se queda en el máximo.
    const t = n === 1 ? 0 : i / (n - 1);
    curvas.push({
      distancia,
      opacidad: opacidadMax + (opacidadMin - opacidadMax) * t,
    });
  }

  return curvas;
}
```

- [ ] **Step 4: Ejecutar y ver pasar**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Escribir la capa**

`src/components/map/SeaChartLayer.tsx`:

```tsx
import { DomUtil } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

import { CCAA_GEO } from '../../utils/cartografia';
import { isobatas } from '../../utils/cartaNautica';
import { leerPaleta } from '../../utils/choroplethScale';
import { mezclar } from '../../utils/color';

/** Por debajo de las regiones (400). El mar nunca tapa la coropleta. */
const PANEL = 'carta';
const NIVELES = 7;
/** Grosor de cada curva. Fino: tiene que estar y no verse a la primera. */
const GROSOR = 0.75;

/**
 * El mar como carta náutica: curvas de nivel finas abrazando la costa.
 *
 * No calcula curvas paralelas ni disuelve las 19 comunidades en una silueta.
 * Apila trazos: por cada nivel pinta el país entero con un trazo de grosor
 * `2·distancia` en el color de la línea y encima el mismo país con grosor
 * `2·(distancia − grosor)` en el color del fondo. El par deja un anillo fino a
 * esa distancia de la costa y borra lo de dentro; los límites interiores entre
 * comunidades desaparecen solos porque los rellenos se solapan.
 *
 * En canvas y no en SVG: son catorce pasadas sobre el país entero, y catorce
 * `<path>` más en el SVG de Leaflet se notarían en cada zoom.
 */
export function SeaChartLayer() {
  const map = useMap();

  useEffect(() => {
    let panel = map.getPane(PANEL);
    if (!panel) {
      panel = map.createPane(PANEL);
      panel.style.zIndex = '350';
      panel.style.pointerEvents = 'none';
    }

    const lienzo = DomUtil.create('canvas', '', panel);
    lienzo.style.position = 'absolute';
    const ctx = lienzo.getContext('2d');
    if (!ctx) return;

    const paleta = leerPaleta();
    const curvas = isobatas(NIVELES);

    const dibujar = () => {
      const tamano = map.getSize();
      const densidad = window.devicePixelRatio || 1;
      lienzo.width = tamano.x * densidad;
      lienzo.height = tamano.y * densidad;
      lienzo.style.width = `${tamano.x}px`;
      lienzo.style.height = `${tamano.y}px`;
      // El lienzo cubre el visor; se ancla en coordenadas de capa para que el
      // arrastre lo mueva con el mapa sin redibujar nada.
      DomUtil.setPosition(lienzo, map.containerPointToLayerPoint([0, 0]));

      ctx.setTransform(densidad, 0, 0, densidad, 0, 0);
      ctx.clearRect(0, 0, tamano.x, tamano.y);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const pais = new Path2D();
      for (const feature of CCAA_GEO.features) {
        const poligonos =
          feature.geometry.type === 'MultiPolygon'
            ? feature.geometry.coordinates
            : [feature.geometry.coordinates];
        for (const poligono of poligonos) {
          for (const anillo of poligono) {
            anillo.forEach((punto, i) => {
              const p = map.latLngToContainerPoint([punto[1]!, punto[0]!]);
              if (i === 0) pais.moveTo(p.x, p.y);
              else pais.lineTo(p.x, p.y);
            });
            pais.closePath();
          }
        }
      }

      // De la curva más lejana a la más cercana: cada par deja su anillo y
      // borra el interior, así que el orden importa.
      for (let i = curvas.length - 1; i >= 0; i--) {
        const { distancia, opacidad } = curvas[i]!;
        // La opacidad se precompone contra el fondo: el canvas pinta opaco y
        // así ningún anillo se suma con el de debajo.
        const tinta = mezclar(paleta.fondo, paleta.borde, opacidad);

        ctx.strokeStyle = tinta;
        ctx.fillStyle = tinta;
        ctx.lineWidth = distancia * 2;
        ctx.fill(pais);
        ctx.stroke(pais);

        ctx.strokeStyle = paleta.fondo;
        ctx.fillStyle = paleta.fondo;
        ctx.lineWidth = Math.max(0, (distancia - GROSOR) * 2);
        ctx.fill(pais);
        ctx.stroke(pais);
      }
    };

    // Durante el zoom el lienzo no escala con el mapa, así que se retira y
    // vuelve ya redibujado. Es una textura tenue: el parpadeo no se lee.
    const ocultar = () => {
      lienzo.style.visibility = 'hidden';
    };
    const mostrar = () => {
      dibujar();
      lienzo.style.visibility = 'visible';
    };

    dibujar();
    map.on('moveend', dibujar);
    map.on('resize', dibujar);
    map.on('zoomstart', ocultar);
    map.on('zoomend', mostrar);

    return () => {
      map.off('moveend', dibujar);
      map.off('resize', dibujar);
      map.off('zoomstart', ocultar);
      map.off('zoomend', mostrar);
      lienzo.remove();
    };
  }, [map]);

  return null;
}
```

- [ ] **Step 6: Montarla en el mapa**

En `src/components/map/SpainMap.tsx`, importar y añadirla como primer hijo del `<MapContainer>`, antes de `<Encuadre>`:

```tsx
import { SeaChartLayer } from './SeaChartLayer';
```

```tsx
      <SeaChartLayer />
      <Encuadre clave={clave} limites={objetivo} onFin={alEncuadrar} />
```

- [ ] **Step 7: Verificar en el navegador**

Run: `npm run dev`

- Las curvas rodean la costa, incluida la de Canarias en su cartela, y se ven pegadas al litoral real (entran en las rías, rodean el cabo de Gata).
- Al arrastrar, el mar se mueve con la tierra. Al soltar, no salta de sitio.
- Al hacer zoom, la densidad de curvas se mantiene: ni se apelotonan ni se abren hasta desaparecer.
- No compiten con la coropleta: entornando los ojos, lo primero que se ve sigue siendo el verde de las comunidades.
- Con el mapa a pantalla completa en móvil, moverlo sigue siendo fluido. Si se nota un tirón al soltar el arrastre, medir `dibujar()` con `performance.now()` y bajar `NIVELES` a 5.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(fase6): el mar como carta náutica

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Cierre — documentación, retirada del banco y verificación completa

**Files:**
- Modify: `DESIGN_SYSTEM.md`
- Delete: `src/lab/Fase6Lab.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Enmendar `DESIGN_SYSTEM.md`**

En la sección "Animación", sustituir las dos líneas que esta fase contradice:

```markdown
- **Panel lateral / bottom sheet:** entra en ~250 ms; al soltar el arrastre la hoja se
  asienta con resorte (Fase 6), no con easing plano. La sombra crece con el levantamiento.
- **Hover en fila de empresa:** cambio de fondo sutil, sin escalado ni sombra — la fila no
  es pulsable y elevarla prometería una acción que no existe. Las filas que sí navegan
  (listado de regiones) se elevan con resorte en hover y en foco de teclado.
```

Añadir al final de la sección:

```markdown
- **Contadores:** el contador nacional y la cifra de la región activa ruedan como un
  cuentakilómetros al cambiar el umbral o la región. Las cifras sobre el mapa, la leyenda y
  el listado cambian en seco: cincuenta y dos números rodando a la vez son ruido.
- **Pulsación:** los controles que hacen algo se hunden al pulsarlos y vuelven con resorte.
  Las provincias del mapa no se encogen —se despegarían de sus vecinas—: comprimen el
  relleno y engordan el borde.
- Las constantes de resorte viven en `src/animation/resortes.ts`, igual que los colores
  viven en `theme.css`. Ningún componente escribe su propia rigidez.
```

En la sección "Layout", tras el diagrama, añadir:

```markdown
El mar alrededor de España lleva isóbatas finas de carta náutica (`SeaChartLayer`), en
píxeles de pantalla para que su densidad no cambie con el zoom. Es fondo: nunca compite con
la coropleta.
```

- [ ] **Step 2: Retirar el banco de pruebas**

```bash
git rm -r src/lab
```

En `src/main.tsx`, volver al render directo de `<App />`: quitar el import de `Fase6Lab` y la constante `banco`.

- [ ] **Step 3: Actualizar el comentario de cabecera de `App.tsx`**

Sustituir el bloque que dice "Fase 5 — pulido":

```tsx
/**
 * Fase 6 — refinamiento físico. Lo de la Fase 5 (España › comunidad › provincia,
 * umbral, buscador y hoja inferior) con peso: contadores que ruedan, controles
 * que se hunden y un mar de carta náutica.
 */
```

- [ ] **Step 4: Verificación completa**

Run: `npm test`
Expected: PASS, todas las suites

Run: `npm run build`
Expected: sin errores de `tsc` ni de Vite

Run: `npm run dev` y recorrer los ocho criterios de aceptación del spec:

1. El slider hace rodar los dos contadores grandes; al soltar se asientan sin salto.
2. Cambiar de región hace rodar la cifra del panel; las 52 cifras del mapa cambian en seco.
3. Con `prefers-reduced-motion`: contadores instantáneos, sin hundimiento, sin trazado, sin rebote en la hoja.
4. El lector de pantalla anuncia la cifra final una vez, no los estados intermedios.
5. Pulsar una fila de región se hunde y vuelve con inercia; la fila de empresa solo cambia de fondo.
6. Las curvas del mar siguen pegadas a la costa al hacer zoom y pan, con densidad estable.
7. El trazado cierra con un retroceso mínimo en la cabeza, sin hueco en el arranque.
8. El foco de teclado eleva las filas igual que el ratón, con el anillo de foco visible.

Además, en móvil (≤1023 px): la hoja arrastra, se asienta con muelle y el listado no se desborda sobre el pie.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs(fase6): enmiendas al sistema de diseño y retirada del banco

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
