# Sistema de diseño: Mapa de transportistas España

## Concepto

Navy / crema / ámbar. Sustituye a la señalética viaria (verde autovía / azul
panel) de la versión anterior por una paleta de dos tonos de marca — navy
como estructura, ámbar como acento único — sobre un fondo crudo en vez de
blanco puro. Decisión consciente del cliente, no una deriva accidental hacia
el look genérico que la propia versión anterior advertía evitar: lo que
distingue esto de un "navy + cream" de plantilla es el hilo conductor (la
carretera como línea que conecta, ver más abajo), las cifras en monoespaciada,
y el marco de navegador del mapa embebido — no la paleta por sí sola.

## Color

| Token | Hex | Uso |
|---|---|---|
| `--color-base` | `#F6F2EA` | Fondo general — crema, no blanco puro |
| `--color-ink` | `#17181A` | Texto principal |
| `--color-navy-950` | `#0C1E3D` | Fondo del hero (zona más oscura) y del pie de página |
| `--color-navy-800` | `#16305A` | Fondo del hero (zona superior); superficie oscura secundaria (barra de cobertura, pulgar del slider en reposo) |
| `--color-atencion` | `#DFA23A` | Ámbar — único acento: CTA, filtro activo, hover del mapa, foco de teclado, enlaces |
| `--color-asfalto` | `#8B93A1` | Gris-azulado neutro — bordes, texto secundario, estado inactivo |
| `--color-mar` | `#9FB0C9` | El mar del mapa — `--color-navy-800` rebajado ~45% sobre `--color-base`, no un azul traído de fuera. ~8:1 de contraste con la tinta |

Un único acento (ámbar) y no dos como en la versión anterior (verde +
ámbar): con la paleta reducida a dos tonos de marca, separar "esto mide
transportistas" de "esto es informativo/estructural" ya no se resuelve con
un segundo color de acento — se resuelve con navy (estructura, p. ej.
`CoverageChip`) frente a ámbar (interacción/atención). Ver el comentario de
`CoverageChip.tsx` para el caso concreto que motivó la distinción.

La coropleta del mapa usa una escala de 6 pasos, crema → ámbar → navy (no
verde), calculada por cuantiles sobre los valores presentes — nunca lineal,
el reparto de empresas de transporte por España es muy desigual. Cada paso
lleva además la cifra visible (accesibilidad), no solo color:

```
0 empresas   → #EFEAE0
1er cuantil  → #D8C9A8
2º cuantil   → #C9A868
3er cuantil  → #B98A3F
4º cuantil   → #8A5A2E
5º cuantil   → #16305A (navy, máxima densidad)
```

Debajo de la coropleta hay un mapa base físico de verdad (Esri
`World_Physical_Map` para el color + `World_Hillshade` en `multiply` para la
sombra del terreno, ver `TESELAS` en `SpainMap.tsx`), no el terreno lavado de
antes. El reparto es el de una carta: **dentro de España manda el dato** —el
relleno va al 92% de opacidad para que el color siga siendo cotejable con su
casilla de leyenda— y **fuera manda el terreno**, que es lo único que ese
territorio tiene que contar. Portugal, Francia o el Magreb con su verde y su
ocre no son decoración: son lo que hace que España se lea como un país en un
mapa y no como una silueta recortada.

## Tipografía

Sin cambios respecto a la versión anterior — ya cumplía lo que pediría
cualquier brief nuevo:

- **Display (títulos, nombre de región activa):** Archivo, eje `wdth`
  variable — 112% en la herramienta (`rotulo`), 125% en la landing
  (`rotulo-landing`).
- **Cuerpo:** Inter.
- **Datos (cifras, NIF, umbral, contadores):** IBM Plex Mono. Todo lo que sea
  un dato "de tabla" o un contador va en monoespaciada — separa visualmente
  dato de prosa.

## Forma

- Radios: `rounded-sm` (4px) en controles pequeños, `rounded-xl` (12px) en
  tarjetas y en el marco de navegador del mapa embebido — escala por defecto
  de Tailwind 4, sin tokens propios. El mapa en sí sigue sin radio: los
  límites de provincia ya son la forma.
- Sombras: tres alturas (`--shadow-apoyo/alta/mano` en `theme.css`), con
  tinte navy (`rgba(12,30,61,…)`) en vez de gris neutro — cohesiona más con
  el resto de la paleta. Mecanismo sin cambios (`animation/elevacion.ts`).

## El hilo conductor

Una carretera como línea que conecta, con el mismo significado cada vez que
aparece — dos apariciones y ninguna más:

1. **Hero** (`RedDeRutas.tsx`): corredores radiales que se dibujan solos al
   cargar, con paradas que pulsan una vez al llegar la línea.
2. **Mapa → listado** (`ConectorSeleccion.tsx`): al seleccionar una
   provincia, una línea se dibuja desde su centroide hasta la cabecera del
   listado — la ruta hacia el resultado, literalmente. Se suma al trazado de
   perímetro de `RouteTraceOverlay.tsx` (que sigue marcando la selección
   sobre el propio mapa); no lo sustituye — son dos lecturas del mismo
   motivo, una sobre el mapa y otra hacia el panel.

No se multiplica en más sitios. Un momento bien ejecutado pesa más que diez
animaciones sueltas. (Hubo una tercera aparición —una guía horizontal
dibujándose a scroll en la antigua `ComoFunciona.tsx`— retirada junto con esa
sección: ver `AsiFuncionaElMapa.tsx`, su reemplazo por capturas.)

## Animación

- **Motion** gobierna las micro-interacciones existentes: `Accion`,
  `Revelar`, `Odometro`, la salida del hero por scroll. Física propia en
  `animation/resortes.ts` — un muelle por intención (elevación, pulsación,
  odómetro, trazado), no valores sueltos en cada componente.
- **Se mueve lo que se acciona, se enciende lo que se lee.** `Tarjeta` llevaba
  la misma elevación con giro 3D que `Accion` y se le quitó: son cuatro
  bloques de texto de la sección "Por qué", y levantarlos bajo el cursor
  prometía un click que no existe además de mover el párrafo justo cuando el
  ojo lo estaba recorriendo. En su lugar se encienden en ámbar de neón
  —filete más halo en dos radios, clase `.tarjeta` en `theme.css`— y el icono
  se enciende con ellas por `group-hover`. Solo color y luz: no hay nada que
  reducir bajo `prefers-reduced-motion`, así que la pieza no necesita rama.
- **GSAP** (`animation/gsap.ts`, registro único de plugins — todos gratuitos
  desde la compra de Webflow) entra donde Motion no llega bien:
  - `SplitText`: entrada por palabras del titular del hero. Único uso del sitio.
  - `Draggable`: el slider de umbral custom (`EmployeeThresholdSlider.tsx`).
  - `Flip`: reordena `RegionList.tsx` cuando el umbral cambia el ranking.
    No se usa en `CompanyList.tsx` — esa lista está virtualizada
    (`react-window`) y puede traer miles de filas; Flip necesita elementos
    DOM estables para medir, y con filas recicladas no hay "antes" que
    comparar.
  - `DrawSVG`: el conector mapa→listado (`ConectorSeleccion.tsx`).
  - `ScrollTrigger`: registrado en `animation/gsap.ts` pero sin uso actual —
    lo llevaba el scrollytelling de la antigua `SeccionMapa` (pilotaba el
    mapa real vía una prop `demo` de `App` según el paso a la vista), retirado
    junto con `ComoFunciona` a favor de `AsiFuncionaElMapa` y una `SeccionMapa`
    de marco fijo, sin demo.
- El trazado de firma (`RouteTraceOverlay`, muelle `RESORTE_TRAZADO`) y el
  cambio de color de la coropleta (200ms, `.region` en `theme.css`) no han
  cambiado de mecanismo, solo de paleta.
- `prefers-reduced-motion`: cada pieza nueva comprueba `useMenosMovimiento()`
  o `window.matchMedia` igual que las existentes — sin excepciones. La regla
  global de `theme.css` (duraciones a 0.01ms) sigue siendo la red de
  seguridad final.

## Accesibilidad de la coropleta

Sin cambios de fondo: nunca solo color. Cada paso lleva la cifra visible
sobre la propia región, con halo del color del relleno para legibilidad
sobre el mar. `VAR_CIFRA` en `choroplethScale.ts` decide tinta clara u
oscura por paso para mantener contraste AA sobre los nuevos rellenos.
