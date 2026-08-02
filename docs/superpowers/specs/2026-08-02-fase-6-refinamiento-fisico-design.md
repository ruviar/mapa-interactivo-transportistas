# Fase 6 — Refinamiento visual físico

Fecha: 2026-08-02
Estado: aprobado en conversación, pendiente de plan de implementación

## Objetivo

Que los paneles, números y regiones se comporten como objetos con peso y materialidad,
dentro del mismo lenguaje de señalética viaria de `DESIGN_SYSTEM.md`. Es física e
interacción, no color nuevo ni efectos genéricos de "web moderna".

Punto de partida: Fase 5 cerrada (hoja inferior con arrastre, trazado de firma,
`prefers-reduced-motion` global en `theme.css`, foco de teclado visible).

## Decisiones cerradas

| Decisión | Elección | Motivo |
|---|---|---|
| El mar | Isóbatas que viajan con el mapa | Una trama fija se lee como papel pintado: la tierra se desliza sobre un mar quieto, justo lo contrario de la premisa física de la fase |
| Filas de empresa | Sin pulsación ni elevación | No son pulsables (son `div`, no navegan a nada); darles afordancia sería una promesa falsa |
| Alcance del odómetro | Solo contador nacional y cifra de región activa | Las 52 cifras del mapa son HTML crudo dentro de `divIcon`; 52 números rodando en cada píxel del slider es ruido, no materialidad |
| Librería | `motion/react` | Pedido en el enunciado. Nada de Three.js/WebGL |

## Arquitectura: capa de física compartida

El enunciado pide "elevación consistente". Sin un sitio único donde vivan las constantes,
consistente es una intención y no algo verificable. Por eso la fase introduce una capa
delgada y todos los componentes consumen de ella.

```
src/animation/
  fisica.ts          # constantes de resorte con nombre + useMenosMovimiento()
  Odometro.tsx       # cifra que rueda
  Pulsable.tsx       # hundimiento al pulsar + elevación en hover/foco
```

`fisica.ts` es al movimiento lo que `@theme` de `theme.css` es al color: la única fuente.
Ningún componente escribe `stiffness` ni `damping` sueltos, igual que hoy ninguno escribe
un hex suelto.

Constantes previstas (valores definitivos los fija el banco de pruebas):

- `RESORTE_PULSACION` — hundimiento y recuperación de controles.
- `RESORTE_ELEVACION` — hover/foco de filas, sombra del panel, asentamiento de la hoja.
- `RESORTE_ODOMETRO` — muelle que arrastra el valor numérico.
- `RESORTE_TRAZADO` — trazado de firma con rebote.

`useMenosMovimiento()` envuelve el `useReducedMotion()` de Motion. Existe como función
propia porque hoy hay tres sitios con `matchMedia('(prefers-reduced-motion: reduce)')`
copiado a mano (`RouteTraceOverlay`, `LoadingSilhouette`, `Encuadre` en `SpainMap`); esta
fase no los migra, pero todo lo nuevo pasa por aquí.

### Interfaz de las primitivas

**`<Odometro valor={n} />`** — recibe un número, se encarga del formato `es-ES`, del
rodaje y de la accesibilidad. No sabe nada de empresas ni de regiones.

**`<Pulsable elevado={bool} ... />`** — aplica hundimiento al pulsar y, si el control está
elevado en reposo, elevación en hover/foco y compresión de sombra al pulsar. No sabe qué
acción envuelve.

Las provincias del mapa **no** usan `<Pulsable>`: son `<path>` que crea Leaflet fuera del
árbol de React. Su física va en el propio `ChoroplethLayer`, con las mismas constantes.

## 1. Contadores tipo cuentakilómetros

Un `useSpring` por contador sobre el **valor numérico**; las columnas de dígitos se derivan
de él. Consecuencia útil: al arrastrar el slider de umbral los dígitos ruedan de forma
continua y al soltar se asientan solos — no hay que detectar el final del gesto, ni añadir
debounce, ni tocar el `useDeferredValue` que ya tiene `App.tsx`.

Dos mecánicas se construyen en el banco de pruebas y se elige una viéndolas:

- **A, rueda real.** La columna de las decenas solo gira cuando la de las unidades pasa
  de 9. Fiel a un cuentakilómetros. En saltos grandes (42.839 → 3.120) gira como una
  tragaperras durante ~400 ms.
- **B, por columna.** Cada columna va a su dígito destino por el camino corto, escalonadas
  de derecha a izquierda (~18 ms de retardo por columna). Legible en cualquier salto,
  menos mecánica.

Elegida una, la otra se borra: no queda como opción configurable.

Dónde se aplica:

- `StatsCounter` — contador nacional de la cabecera.
- `Sidebar` — cifra de la región activa en el asomo (`conteo.cumplen`).

Detalles de construcción:

- El separador de millares es una columna fija, no rueda.
- Las cifras ya van en IBM Plex Mono con `tabular-nums`: todas las columnas miden igual y
  no hay salto de layout al cambiar de dígito.
- Al ganar o perder dígito (999 → 1.004) la columna nueva entra desde arriba con el mismo
  muelle, no aparece de golpe.
- Estado `null` (datos aún sin cargar): se pinta el `—` de ahora, sin envoltorio animado.

Accesibilidad:

- El bloque animado va `aria-hidden`, con un `<span class="sr-only">` que lleva la cifra
  final. Sin esto, el `aria-live="polite"` que ya existe en `StatsCounter` y en `Sidebar`
  haría que el lector de pantalla recitase decenas de estados intermedios en cada tirón
  del slider.
- Con `prefers-reduced-motion`, `<Odometro>` renderiza el texto tal cual: sin columnas,
  sin muelle, sin nodo oculto.

## 2. Estados de pulsación física

Al pulsar: `scale` 0.97 y la sombra se comprime a la altura de reposo. Al soltar: resorte
con recuperación de ~220 ms y un rebote corto. No es un `:active` de CSS — reanuda desde
la velocidad que lleve, así que pulsar dos veces seguidas no reinicia el movimiento en seco.

La compresión de sombra solo tiene sentido en lo que está elevado en reposo. Los controles
planos (texto sobre el propio panel) se hunden con la escala y nada más: comprimir una
sombra que no existe obligaría a inventarles elevación, y entonces media interfaz flotaría.

Se aplica donde hay acción:

| Control | Escala | Sombra |
|---|---|---|
| Filas de `RegionList` | sí | sí (elevadas en hover/foco) |
| Asa de la hoja (`SheetHandle`) | sí | sí (la hoja está elevada) |
| Segmentos navegables de `Breadcrumb` (los que llevan `onVolver`; el actual es un `<span>`) | sí | no |
| Cabeceras de orden de `CompanyListHeader` | sí | no |
| Cruz de borrado de `SearchBox` | sí | no |

Quedan fuera:

- **Filas de empresa** (`CompanyRow`): conservan el tinte de hover actual, sin sombra ni
  escala. Decisión cerrada arriba.
- **Controles de zoom de Leaflet**: los pinta Leaflet como `<a>` con su propio CSS.
  Meterlos obligaría a duplicar la física en CSS, que es exactamente lo que esta fase
  intenta no hacer. Se quedan como están.

### Provincias del mapa

Sin escala geométrica. Una provincia que encoge se despega de sus vecinas y miente sobre
la geografía. La pulsación se expresa donde sí es física en un mapa:

- Al pulsar: el relleno se comprime (oscurece hacia `--color-ink`) y el borde ámbar engorda
  de 2.5 a ~3.2, ambos con resorte.
- Al soltar: recuperación con muelle y, encadenado, el trazado de firma que ya existe.

El `<path>` que crea Leaflet es SVG normal y Motion lo anima sin intermediarios; no hace
falta pasar por `setStyle` en cada fotograma.

## 3. Elevación consistente

Escala de elevación con nombre en `theme.css`, tres alturas: reposo, hover/foco, arrastre.
Una sola definición que comparten filas, panel y hoja.

- **Filas de región:** hover y foco elevan a la altura media, con 1 px de subida y resorte.
  El foco de teclado provoca la misma elevación que el ratón — hoy solo cambia el fondo.
- **Hoja inferior:** el arrastre ya sigue al dedo. Lo nuevo es que el asentamiento al soltar
  pase de `transition-transform ease-out 250 ms` a resorte, y que la sombra crezca con lo
  desplegada que esté la hoja (no un valor fijo).
- **Panel lateral en escritorio:** no "aparece" — es una columna fija que siempre está
  (`lg:static`). Se reinterpreta como dos cosas que sí ocurren:
  1. Sombra de reposo real en su borde izquierdo, en lugar del `lg:border-l` plano de ahora.
  2. Al cambiar de región, el contenido del panel entra con 12 px de desplazamiento y
     resorte. Esa es la aparición que existe de verdad en escritorio.

## 4. El mar como carta náutica

Capa canvas propia (`src/components/map/SeaChartLayer.tsx`) en un pane de Leaflet por
debajo de la coropleta (zIndex ~350, por debajo del 400 de las regiones).

**Técnica: apilado de trazos.** Se pinta el conjunto de features de CCAA (relleno + trazo)
varias veces con anchos decrecientes, alternando color de línea y color de fondo. Cada
pasada tapa el interior de la anterior y deja un anillo fino. Dos propiedades que la hacen
la opción correcta aquí:

- Los bordes interiores entre comunidades desaparecen solos, porque los rellenos se solapan.
  No hace falta disolver los 19 polígonos en una silueta nacional.
- Cada anillo es el desplazamiento real de la costa a esa distancia, no una elipse
  concéntrica: las curvas abrazan las entradas y salientes del litoral.

Parámetros: 6-7 anillos, separación creciente hacia mar abierto (como isóbatas de verdad),
grosor 0.75 px, `--color-asfalto` con opacidad de 0.09 en el anillo pegado a la costa a
0.02 en el más lejano.

La separación se calcula en **píxeles de pantalla**, no en grados: la densidad se ve igual
a cualquier zoom y las curvas no se abren hasta desaparecer al acercarse. Se redibuja en
`zoomend` y `resize`; durante el pan se traslada el canvas, como hace Leaflet con el suyo.

Coste: 19 features × ~14 pasadas en canvas, despreciable. No toca el SVG de la coropleta.
Es un elemento estático: `prefers-reduced-motion` no le afecta.

## 5. Trazado de firma, con más peso

El trazado ya existe (`RouteTraceOverlay`). Cambia la curva: de `cubic-bezier(0.4, 0, 0.2, 1)`
a resorte con rebote leve al final.

Aplicar un muelle a `stroke-dashoffset` tiene una trampa: sobrepasar el 0 deja el offset en
negativo y el hueco no aparece al final del trazo, sino **al principio** — la línea se
despega de su punto de arranque y se lee como un fallo de dibujo.

Solución: el muelle no mueve el offset, mueve un progreso `p` que se acota en 1
(`dashoffset = L · (1 − min(1, p))`). El primer sobrepaso queda tapado por el tope —el
trazo llega al cierre a toda velocidad y se para en seco, como una punta contra un tope— y
lo que se ve del rebote es la oscilación siguiente, el momento en que `p` baja de 1: la
cabeza del trazo retrocede unos píxeles y vuelve a cerrar. El hueco cae en la cabeza, que
es donde el ojo está mirando, y no en el arranque.

Al asentarse, pulso corto de grosor (2.5 → ~2.9 → 2.5): el peso de la línea al pararse.

Sigue siendo un único momento de protagonismo: solo al seleccionar provincia, una vez, y
desactivado con `prefers-reduced-motion` como hasta ahora.

## 6. Banco de pruebas

`src/lab/Fase6Lab.tsx`, montado desde `main.tsx` cuando la URL lleva `?lab`. Es lo primero
que se enseña, antes de tocar la interfaz real.

Contenido:

- Las dos mecánicas de odómetro lado a lado, con botones de salto pequeño y salto grande,
  y un slider que imita al de umbral.
- Pulsación física en una fila y en una provincia.
- Trazado de firma con rebote.
- Dos deslizadores de rigidez y amortiguación en vivo: la sensación se acuerda moviendo
  números, no adjetivos. Los valores elegidos quedan escritos en `fisica.ts`.

Se borra de un tirón al cerrar la fase: un archivo y tres líneas en `main.tsx`.

## Enmiendas a DESIGN_SYSTEM.md

Dos líneas de la sección "Animación" quedan contradichas por esta fase y se actualizan en
el mismo commit, o el documento contradice a la app desde el día uno:

- «Panel lateral / bottom sheet: slide-in/out ~250 ms, easing estándar, **sin rebote**» →
  asentamiento con resorte.
- «Hover en fila de empresa: cambio de fondo sutil, **sin escalado ni sombra**» → sigue
  siendo cierto para la fila de empresa; se precisa que las filas que navegan sí elevan.

Se añade una línea sobre el mar como textura de carta náutica en la sección de layout o de
mapa, y una nota de que las constantes de resorte viven en `src/animation/fisica.ts`.

## Lo que no cambia

- Paleta intacta. Ni un color nuevo.
- Sin gradientes de fondo, glassmorphism ni partículas.
- El mar es fondo discreto, nunca protagonista.
- El trazado de firma sigue siendo el único momento animado con protagonismo.
- Sin Three.js, WebGL ni ninguna librería 3D.

## Riesgos

- **El `prefers-reduced-motion` global de `theme.css` no protege nada de esta fase.** Mata
  transiciones y animaciones CSS; las animaciones JS de Motion siguen corriendo. Cada
  primitiva consulta `useMenosMovimiento()` explícitamente. Es el fallo más fácil de cometer
  aquí y hay que verificarlo a mano en el navegador.
- `motion/react` añade ~20-25 kB gzip del subconjunto que se usa.
- El odómetro cuelga de un muelle que corre a 60 fps mientras el slider se mueve. Hay que
  comprobar que no compite con el recuento de 42.839 empresas que ya hace `App.tsx` en cada
  cambio de umbral.
- No hay repositorio git en el proyecto: este spec queda escrito sin commit.

## Criterios de aceptación

Verificables en navegador, no por compilación (compilar y pasar tests no es verificación
visual):

1. Mover el slider de umbral hace rodar los dos contadores grandes de forma continua; al
   soltar se asientan sin salto.
2. Cambiar de región hace rodar la cifra del panel; las 52 cifras del mapa cambian en seco.
3. Con `prefers-reduced-motion` activo: los contadores cambian al instante, no hay
   hundimiento al pulsar, no hay trazado, no hay rebote en la hoja.
4. Un lector de pantalla anuncia la cifra final una vez, no los estados intermedios.
5. Pulsar una fila de región se hunde y vuelve con inercia; pulsar una fila de empresa no
   hace nada visual más allá del tinte de hover actual.
6. Las curvas del mar siguen pegadas a la costa al hacer zoom y pan, con densidad estable
   en pantalla, y no compiten con la coropleta.
7. El trazado de provincia cierra el perímetro con un retroceso mínimo en la cabeza del
   trazo, y en ningún momento aparece un hueco en su punto de arranque.
8. El foco de teclado eleva las filas igual que el ratón, y el anillo de foco sigue visible.

## Fuera de alcance

- Hacer pulsable la fila de empresa (requiere diseñar qué muestra ese detalle).
- Física en los controles de zoom de Leaflet.
- Migrar los tres `matchMedia` existentes a `useMenosMovimiento()`.
- Cualquier cambio de paleta, tipografía o layout.
