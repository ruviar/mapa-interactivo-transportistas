import { TESELAS } from '../map/SpainMap';
import { CCAA_GEO } from '../../utils/cartografia';

/**
 * Nota metodológica. Vive en el pie en escritorio y dentro de la hoja inferior
 * en móvil, así que el texto está aquí y no duplicado en los dos sitios.
 *
 * Es deliberadamente discreta pero no opcional: el nº de empleados es un proxy
 * del tamaño de flota, y la interfaz no puede dejar que se lea como un recuento
 * de camiones.
 *
 * Recoge además las dos atribuciones cartográficas —la de los límites y la del
 * mapa base—, porque el mapa lleva `attributionControl={false}` y este es el
 * sitio donde se citan las fuentes.
 */
export function NotaDatos({ className = '' }: { className?: string }) {
  return (
    <p className={`text-caption leading-snug text-asfalto ${className}`}>
      CNAE 4941, transporte de mercancías por carretera. El nº de empleados es una aproximación al
      tamaño de flota, no un dato de vehículos.{' '}
      <span className="text-asfalto/80">
        {CCAA_GEO.attribution}. {TESELAS.atribucion}.
      </span>
    </p>
  );
}
