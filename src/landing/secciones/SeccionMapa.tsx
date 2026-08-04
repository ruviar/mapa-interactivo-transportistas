import App from '../../App';
import { useIrAVista } from '../../Raiz';
import { MarcoNavegador } from '../piezas/MarcoNavegador';
import { Revelar } from '../piezas/Revelar';

/**
 * La herramienta, incrustada en la página: un marco de navegador falso
 * alrededor del mapa real —la misma `App` que vive detrás de `?app`, sin
 * ninguna prop de más—. `AsiFuncionaElMapa`, justo arriba, ya cuenta los tres
 * pasos con capturas; aquí no hace falta repetirlos, solo dejar la
 * herramienta a mano para que se pruebe de verdad.
 *
 * Decisiones que vienen del spike de la Fase 0 y no son de estilo:
 *
 * - `data-lenis-prevent` en el marco. Lenis se come la rueda para interpolar
 *   el scroll y Leaflet la necesita entera para su zoom. Con el atributo,
 *   Lenis ve el evento, encuentra la marca subiendo por el `composedPath` y
 *   vuelve sin tocarlo.
 *
 * - Por debajo de `lg` (1024 px) el marco es la ventana entera, sin recuadro
 *   ni margen — la misma cifra a la que `useBottomSheet` cambia al patrón de
 *   hoja inferior (`CONSULTA_HOJA` en ese hook).
 *
 * - `contain-layout` en el marco. Que el marco mida ya lo mismo que la
 *   ventana no basta: `position: fixed` se ancla al primer antecesor que
 *   forme contenedor de posicionamiento, y por defecto ninguno lo forma. Con
 *   `contain: layout` el propio marco pasa a serlo, así el `fixed` de la
 *   hoja se resuelve contra él y no contra la ventana real.
 */
export function SeccionMapa() {
  const irAVista = useIrAVista();

  return (
    <section id="mapa" className="bg-base py-16 sm:py-20 lg:px-8">
      <div className="mx-auto mb-8 max-w-6xl px-4 sm:px-6 lg:px-0">
        <Revelar>
          <p className="font-mono text-caption uppercase tracking-[0.2em] text-asfalto">
            La herramienta
          </p>
          <h2 className="rotulo-landing mt-3 max-w-3xl text-titular text-ink">
            Empieza por el mapa. Baja hasta la empresa.
          </h2>
          <p className="mt-4 max-w-2xl text-body-sm text-ink/70">
            Elige comunidad, luego provincia, y mueve el umbral de plantilla para quedarte solo
            con las empresas del tamaño que buscas. El listado y los contadores se recalculan
            mientras arrastras.
          </p>
        </Revelar>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-0">
        <Revelar retardo={0.1}>
          <MarcoNavegador
            data-lenis-prevent
            data-testid="marco-mapa"
            className="h-dvh w-full contain-layout lg:h-[78svh]"
          >
            <App />
          </MarcoNavegador>
        </Revelar>
      </div>

      <div className="mx-auto mt-5 flex max-w-6xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-4 sm:px-6 lg:px-0">
        <p className="font-mono text-caption uppercase tracking-[0.16em] text-asfalto">
          Sobre el mapa la rueda acerca · fuera del marco continúa la página
        </p>
        <a
          href="?app"
          onClick={(e) => {
            e.preventDefault();
            irAVista('app');
          }}
          className="border-b border-atencion/40 text-body-sm text-atencion hover:border-atencion"
        >
          Abrir la herramienta a pantalla completa
        </a>
      </div>
    </section>
  );
}
