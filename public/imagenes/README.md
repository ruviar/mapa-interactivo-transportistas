# Imágenes de la landing

Deja aquí los archivos con **el nombre exacto** de la tabla. No hay que tocar
ningún componente: `src/landing/datos/imagenes.ts` ya apunta a estas rutas y
cada hueco se pinta con un respaldo dibujado por código mientras el archivo no
esté (`src/landing/piezas/ImagenODefecto.tsx`).

Ninguna se generó en la sesión en que se escribió esta iteración: no había ni
generación de imágenes ni herramienta de captura de navegador disponibles.

## A. Capturas del producto

Del propio mapa corriendo (`npm run dev`), **no generadas**. Limpias: sin
cursor, sin barra de navegador, sin devtools. Ventana a 1440×900 o más, y a
`devicePixelRatio` 2 si puedes — se ven dentro de un marco de navegador falso
en pantallas grandes.

| Archivo | Qué encuadrar |
|---|---|
| `mapa-nivel-espana.png` | Vista inicial: España entera, las 17 CCAA visibles. |
| `mapa-nivel-provincia.png` | Tras clic en una comunidad. Usa **Cataluña o Andalucía**: son las de mayor densidad y la coropleta se lee bien. |
| `mapa-listado-empresas.png` | Tras clic en una provincia, con el panel de empresas abierto. |
| `mapa-umbral-slider.png` | *(opcional)* El slider de umbral en uso con la burbuja de valor. **Si ya sale visible en `mapa-listado-empresas.png`, no hace falta** — la sección solo usa tres capturas y ésa es la reutilizada. |

## B. Imágenes generadas

Fotográficas / atmosféricas. Prompts literales, para pegar tal cual.

### `hero-bg.jpg` — horizontal, mínimo 1920×1080

> aerial drone photography of a Spanish highway at dusk, long exposure light
> trails from trucks, moody atmosphere, duotone navy blue and warm amber color
> grade, cinematic, no text, no logos

Va detrás del hero, bajo un degradado navy: no hace falta que sea legible por
sí sola, solo que aporte textura. El texto blanco manda.

### `porque-bg.jpg` — horizontal, mínimo 1920×1080

> warehouse logistics yard with parked freight trucks, wide angle, overcast
> natural light, muted palette matching navy and cream tones, no visible
> branding or text

Se usa muy oscurecida, con overlay navy encima. Interesa la silueta, no el
detalle.

### `contacto-bg.jpg` — mínimo 1600×1200

> close-up of a truck side mirror reflecting a Spanish road, shallow depth of
> field, warm late afternoon light, duotone navy and amber grade, no text, no
> logos, no readable license plates

Apoyo visual de la sección de contacto, en formato 4/3.

## C. Por código, no generada

La textura de grano (`feTurbulence`, opacidad 4%) **no es un archivo**: vive
como utilidad `grano` en `src/styles/theme.css` y se aplica con la pieza
`<Grano />`. No la pidas a un generador.

## Formato

JPEG de calidad ~80 para las generadas (son fondos, y pesan bastante menos que
un PNG); PNG para las capturas, que tienen texto y bordes duros. Si alguna
generada acaba pesando más de ~400 kB, conviene pasarla por un compresor antes
de commitearla.
