import { useState, type ReactNode } from 'react';

import { rutaImagen, type Imagen } from '../datos/imagenes';

interface Props {
  imagen: Imagen;
  /**
   * Clases de caja. Las recibe tanto la imagen como el respaldo: los dos tienen
   * que ocupar exactamente el mismo hueco para que colocar el archivo no mueva
   * la maqueta ni un píxel.
   */
  className?: string;
  /** Lo que se dibuja mientras el archivo no esté. */
  respaldo: ReactNode;
  /** `eager` solo para lo que está arriba del pliegue (el fondo del hero). */
  loading?: 'lazy' | 'eager';
}

/**
 * Un hueco de imagen que no rompe la página si la imagen todavía no existe.
 *
 * Ninguna de las siete imágenes de la iteración está en el repositorio (ver
 * `datos/imagenes.ts`). En vez de dejar rectángulos rotos o comentar los
 * bloques enteros, cada hueco trae un respaldo dibujado por código con la
 * paleta del sitio, y el `onError` es lo que decide: si el archivo está, se ve
 * la foto; si no, el respaldo. Colocar las imágenes no es un cambio de código,
 * es copiar archivos a `public/imagenes/`.
 *
 * El 404 en la consola de desarrollo mientras falten es intencionado —es el
 * recordatorio de que el encargo sigue abierto— y no ocurre en producción una
 * vez colocadas.
 */
export function ImagenODefecto({ imagen, className = '', respaldo, loading = 'lazy' }: Props) {
  const [falta, setFalta] = useState(false);

  if (falta) {
    return (
      <div className={className} aria-hidden={imagen.alt === '' ? true : undefined}>
        {respaldo}
      </div>
    );
  }

  return (
    <img
      src={rutaImagen(imagen)}
      alt={imagen.alt}
      loading={loading}
      decoding="async"
      onError={() => setFalta(true)}
      className={className}
    />
  );
}
