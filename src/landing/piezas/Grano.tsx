/**
 * Grano de película sobre un fondo plano.
 *
 * Es la única "textura" de la iteración que no es un archivo: un `feTurbulence`
 * de 180×180 encapsulado en la utilidad `grano` de `theme.css` y repetido como
 * fondo. Un mosaico pequeño y repetido, y no un filtro SVG aplicado a toda la
 * sección: el filtro obligaría al navegador a rasterizar el ruido al tamaño
 * completo de la sección en cada cambio de tamaño, y la sección de contacto
 * mide pantallas.
 *
 * Al 4% no se ve como ruido: se nota como que el crema tiene superficie. Si se
 * llega a leer el grano, está mal puesto.
 */
export function Grano({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`pointer-events-none absolute inset-0 grano ${className}`} />;
}
