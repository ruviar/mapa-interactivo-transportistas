import { useIrAVista } from '../../Raiz';
import { AVISO_INDEPENDENCIA, CITA_COMPLETA } from '../../utils/fuente';

/**
 * Pie de la landing. No confundir con `components/layout/Footer.tsx`: aquel
 * es el pie de escritorio de la herramienta (la leyenda de la coropleta,
 * dentro de `<App/>`); este es el cierre de la página completa.
 *
 * Va en `--color-navy-950` a propósito: es el mismo navy más oscuro con el
 * que abre el hero, así que la página cierra en el mismo tono con el que
 * empezó en vez de introducir una tercera superficie oscura.
 */
export function PieDePagina() {
  const irAVista = useIrAVista();

  return (
    <footer className="bg-navy-950 px-4 py-10 text-base/70 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="rotulo-landing text-label-lg text-base">Transportistas de España</p>
          <p className="mt-2 max-w-md text-body-sm">
            Mapa de empresas de transporte de mercancías por carretera, por comunidad autónoma y
            provincia, con los vehículos de cada autorización. {CITA_COMPLETA}
          </p>
        </div>

        <nav className="flex gap-6 text-body-sm">
          <a href="#contacto" className="hover:text-base">
            Contacto
          </a>
          <a
            href="?app"
            onClick={(e) => {
              e.preventDefault();
              irAVista('app');
            }}
            className="hover:text-base"
          >
            Ir al mapa
          </a>
        </nav>
      </div>

      <p className="mx-auto mt-8 max-w-6xl border-t border-base/15 pt-4 font-mono text-caption uppercase tracking-[0.14em] text-base/40">
        {AVISO_INDEPENDENCIA}
      </p>
    </footer>
  );
}
