import { useEffect, useRef, useState } from 'react';

import { SpainMap } from '../../components/map/SpainMap';
import { useIrAVista } from '../../Raiz';
import type { Vista } from '../../hooks/useMapNavigation';
import { calcularCortes } from '../../utils/choroplethScale';
import { RECUENTOS_PREVIEW_CCAA } from '../datos/recuentosPreview';
import { Accion } from '../piezas/Accion';
import { Revelar } from '../piezas/Revelar';
import { FUENTE } from '../../utils/fuente';

const CORTES = calcularCortes(Object.values(RECUENTOS_PREVIEW_CCAA));
const VISTA_NACIONAL: Vista = { nivel: 'nacional' };
const nada = () => {};

/**
 * El mapa de verdad, desenfocado, con el CTA en el centro: se enseña la
 * herramienta —no una captura— y la única acción posible es entrar en ella.
 *
 * El Leaflet de dentro va en `decorativo`: sin controles, sin navegación y sin
 * las animaciones de primera visita, que consumirían su marca de sesión antes
 * de llegar a la herramienta. Y solo se monta cuando la sección se acerca al
 * viewport: las ~15 teselas de Esri no tienen que pedirse por leer el hero.
 *
 * `inert` + `pointer-events-none` en el envoltorio: ni la rueda hace zoom bajo
 * el scroll de Lenis, ni el tabulador se cuela en un mapa que no se puede usar.
 */
export function SeccionMapa() {
  const irAVista = useIrAVista();
  const marcoRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const marco = marcoRef.current;
    if (!marco) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    observador.observe(marco);
    return () => observador.disconnect();
  }, []);

  return (
    <section id="mapa" className="bg-base px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Revelar>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-asfalto">
            La herramienta
          </p>
          <h2 className="rotulo-landing mt-3 max-w-2xl text-titular text-ink">
            El mapa, listo para consultar.
          </h2>
          <p className="mt-4 max-w-2xl text-body text-ink/70">
            Toda España coloreada por nº de empresas autorizadas. Entra, elige comunidad y
            provincia, y baja hasta la empresa — con buscador sobre las{' '}
            {FUENTE.empresas.toLocaleString('es-ES')} del registro y filtro por nº de vehículos.
          </p>
        </Revelar>

        <Revelar retardo={0.1}>
          <div
            ref={marcoRef}
            className="relative mt-10 h-[24rem] overflow-hidden border border-asfalto/40 bg-mar/40 shadow-[var(--shadow-alta)] sm:h-[30rem]"
          >
            {visible && (
              <div
                aria-hidden="true"
                inert
                className="pointer-events-none h-full w-full scale-[1.02] blur-[4px] select-none"
              >
                <SpainMap
                  vista={VISTA_NACIONAL}
                  clave="nacional"
                  provinciasGeo={null}
                  recuentosCCAA={RECUENTOS_PREVIEW_CCAA}
                  recuentosProvincias={null}
                  cortesCCAA={CORTES}
                  cortesProvincias={CORTES}
                  cargando={false}
                  pistaActiva={false}
                  onSeleccionarCCAA={nada}
                  onSeleccionarProvincia={nada}
                  onAlejarNivel={nada}
                  decorativo
                />
              </div>
            )}

            {/* El velo apenas oscurece: su trabajo es dar contraste al CTA sin
                esconder el mapa que se está prometiendo. */}
            <div className="absolute inset-0 z-10 grid place-items-center bg-navy-950/15">
              <Accion
                href="?app"
                onClick={(e) => {
                  e.preventDefault();
                  irAVista('app');
                }}
              >
                Ir al mapa
              </Accion>
            </div>
          </div>
        </Revelar>

        <p className="mt-3 text-caption text-asfalto">
          Vista previa con todas las empresas del registro. Dentro, el filtro es tuyo.
        </p>
      </div>
    </section>
  );
}
