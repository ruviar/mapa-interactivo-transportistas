# Imágenes de la landing

Deja aquí los archivos con **el nombre exacto** de la tabla. No hay que tocar
ningún componente: `src/landing/datos/imagenes.ts` ya apunta a estas rutas y
cada hueco se pinta con un respaldo dibujado por código mientras el archivo no
esté (`src/landing/piezas/ImagenODefecto.tsx`).

Ninguna se generó en la sesión en que se escribió esta iteración: no había ni
generación de imágenes ni herramienta de captura de navegador disponibles.

La landing ya no explica el mapa con capturas ni lo embebe en el scroll: el
mapa es la herramienta a pantalla completa (`?app`), a la que se llega con los
enlaces "Ir al mapa". Por eso aquí solo quedan las imágenes generadas de
fondo.

## Imágenes generadas

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

## Por código, no generada

La textura de grano (`feTurbulence`, opacidad 4%) **no es un archivo**: vive
como utilidad `grano` en `src/styles/theme.css` y se aplica con la pieza
`<Grano />`. No la pidas a un generador.

## Formato

JPEG de calidad ~80 (son fondos, y pesan bastante menos que un PNG). Si alguna
acaba pesando más de ~400 kB, conviene pasarla por un compresor antes de
commitearla.
