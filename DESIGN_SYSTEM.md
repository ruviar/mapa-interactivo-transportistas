# Sistema de diseño: Mapa de transportistas España

## Concepto
La señalética viaria española como lenguaje visual. No es un tema "bonito" aplicado por
encima — es lo que ya usa el propio dominio para comunicar información geográfica y
categórica de un vistazo, en carretera, a velocidad. Verde para autovía, azul para
información de servicio, blanco/negro para carreteras convencionales, ámbar para lo
que requiere atención. Reutilizamos ese código porque ya es intuitivo para cualquier
español y encaja con el contenido exacto de esta herramienta.

Evitar explícitamente: fondo crema + serif + acento terracota; negro + acento neón;
maquetación tipo periódico con reglas finas. Ninguno tiene relación con el dominio.

## Color

| Token | Hex | Uso |
|---|---|---|
| `--color-base` | `#F6F5F1` | Fondo general — blanco carretera envejecido, no blanco puro |
| `--color-ink` | `#1B211D` | Texto principal — negro con matiz verdoso, como el asfalto |
| `--color-autovia` | `#0A6847` | Verde autovía — acento primario, estados activos, CCAA con más resultados |
| `--color-panel` | `#0F4C8A` | Azul panel informativo — elementos de navegación, breadcrumb, links |
| `--color-atencion` | `#E8A33D` | Ámbar de atención — filtro activo, highlight de selección, hover en mapa |
| `--color-asfalto` | `#9CA39D` | Gris neutro — bordes, divisores, texto secundario, estado inactivo |

La coropleta del mapa usa una escala de `--color-base` → `--color-autovia` (5 pasos),
nunca solo diferencias de tono sutiles: cada paso lleva también un valor numérico visible
al hacer hover/tap, para no depender solo del color (accesibilidad).

## Tipografía

- **Display (títulos, nombres de región al navegar):** Archivo Expanded, SemiBold/Bold.
  Condensada/expandida como la lettering de señal de autopista, usada con moderación —
  solo en el nombre de la CCAA/provincia activa y en el título de cabecera.
- **Cuerpo (UI general, listados, filtros):** Inter, Regular/Medium. Neutra y muy legible
  a tamaños pequeños, que es la mayoría de la interfaz.
- **Datos (NIF, cifras, coordenadas, contadores):** IBM Plex Mono, Regular. Todo lo que
  sea un dato "de tabla" o identificador va en monoespaciada — evoca el manifiesto/albarán
  impreso y ayuda a escanear columnas de números.

Escala tipográfica sugerida (rem): 0.75 / 0.875 / 1 / 1.25 / 1.75 / 2.5
(caption / body-sm / body / label-lg / heading / display)

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Título]        España · X empresas       [Slider empleados] │  Header, ~60px
├───────────────────────────────────┬───────────────────────────┤
│                                     │ España > Aragón > Zaragoza│ Breadcrumb
│                                     ├───────────────────────────┤
│                                     │ 🔍 Buscar empresa...      │
│                                     ├───────────────────────────┤
│           MAPA                      │ TRANS SESE SL             │
│        (coropleta,                  │ B50600527 · 12 empl.       │
│      clic para navegar)             │ ─────────────────────────│
│                                     │ CARRERAS GRUPO LOGISTICO  │
│                                     │ A50018837 · 8 empl.        │
│                                     │ ...                        │
│                                     │ [lista virtualizada]       │
├─────────────────────────────────────┴───────────────────────────┤
│ Leyenda coropleta (gradiente + valores)      Nota metodológica  │  Footer, ~40px
└─────────────────────────────────────────────────────────────────┘
```

Mapa ocupa ~65-70% del ancho en desktop, panel lateral fijo a la derecha ~30-35%.
En tablet/móvil: el panel se convierte en hoja inferior (bottom sheet) que sube al
seleccionar provincia, mapa a pantalla completa por defecto.

## Elemento de firma

Al seleccionar una provincia, el borde de esa provincia se dibuja con una animación de
"trazado de ruta" — una línea que recorre el perímetro como si fuera una carretera
señalizándose en el mapa, en vez de simplemente cambiar de color de golpe. Es el único
momento de protagonismo animado de toda la interfaz; todo lo demás es funcional y quieto.

## Animación (con moderación, nunca decorativa)

- **Selección de CCAA/provincia:** `flyTo`/`fitBounds` del mapa con easing ~350-450ms.
  Borde de la región seleccionada se traza (ver elemento de firma), ~600ms una sola vez.
- **Cambio de filtro (slider empleados):** transición de color en la coropleta ~200ms,
  sin retraso perceptible — tiene que sentirse "vivo" al mover el slider.
- **Panel lateral / bottom sheet:** slide-in/out ~250ms, easing estándar, sin rebote.
- **Hover en fila de empresa:** cambio de fondo sutil, sin escalado ni sombra.
- **Carga inicial:** silueta de España con una línea punteada dibujándose una vez,
  disuelve al cargar los datos. No repetir en cargas posteriores.
- Respetar `prefers-reduced-motion`: desactivar el trazado de ruta y usar transiciones
  instantáneas o muy breves (<100ms) en su lugar.

## Accesibilidad de la coropleta

Nunca codificar solo por color. Cada paso de la escala lleva un patrón sutil de textura
(o al menos un valor numérico en tooltip/hover permanente en el propio SVG, no solo hover)
para que la información sea legible también en escala de grises o para daltonismo.
