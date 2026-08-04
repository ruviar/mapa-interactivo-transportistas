/**
 * Las imágenes de la landing, en un solo sitio.
 *
 * Ninguna está todavía en el repositorio: esta sesión no tenía ni generación
 * de imágenes ni herramienta de captura de navegador, así que lo que hay es el
 * encargo escrito y un respaldo dibujado por código para cada hueco
 * (`ImagenODefecto`). La página se ve entera y coherente sin ellas.
 *
 * Para colocarlas no hay que tocar ni un componente: se dejan los archivos con
 * el nombre exacto de `archivo` dentro de `public/imagenes/` y aparecen solas
 * —Vite sirve `public/` en la raíz, así que `/imagenes/hero-bg.jpg` es la ruta
 * final tanto en `dev` como en `build`—. El respaldo solo se pinta si el
 * archivo no está.
 *
 * El texto de `instruccion` es literal a propósito: en las generadas es el
 * prompt tal cual hay que pegarlo, y así no se pierde entre commits. La copia
 * larga con encuadres y notas está en `public/imagenes/README.md`.
 */
export interface Imagen {
  /** Nombre exacto del archivo dentro de `public/imagenes/`. */
  archivo: string;
  /** `alt` real para las capturas; cadena vacía en las decorativas. */
  alt: string;
  /** De dónde sale: una captura del producto o una imagen generada. */
  origen: 'captura' | 'generada';
  /** Prompt literal (generadas) o qué hay que encuadrar (capturas). */
  instruccion: string;
}

export const IMAGENES = {
  heroFondo: {
    archivo: 'hero-bg.jpg',
    alt: '',
    origen: 'generada',
    instruccion:
      'aerial drone photography of a Spanish highway at dusk, long exposure light trails from trucks, moody atmosphere, duotone navy blue and warm amber color grade, cinematic, no text, no logos',
  },
  porQueFondo: {
    archivo: 'porque-bg.jpg',
    alt: '',
    origen: 'generada',
    instruccion:
      'warehouse logistics yard with parked freight trucks, wide angle, overcast natural light, muted palette matching navy and cream tones, no visible branding or text',
  },
  contactoFondo: {
    archivo: 'contacto-bg.jpg',
    alt: '',
    origen: 'generada',
    instruccion:
      'close-up of a truck side mirror reflecting a Spanish road, shallow depth of field, warm late afternoon light, duotone navy and amber grade, no text, no logos, no readable license plates',
  },
} as const satisfies Record<string, Imagen>;

/** Ruta pública del archivo. `public/` se sirve en la raíz, en dev y en build. */
export function rutaImagen(imagen: Imagen): string {
  return `/imagenes/${imagen.archivo}`;
}
