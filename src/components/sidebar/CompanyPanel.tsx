import { ChevronDown } from 'lucide-react';
import {
  useDeferredValue,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useMenosMovimiento } from '../../animation/fisica';
import { gsap } from '../../animation/gsap';
import { Latido } from '../../animation/Latido';
import { Pulsable } from '../../animation/Pulsable';
import type { Orden } from '../../hooks/useFilteredCompanies';
import type { Empresa } from '../../types/company';
import { filtrarPorTexto, terminosDe } from '../../utils/busqueda';
import {
  etiquetaFiltro,
  filtroActivo,
  PASOS_VEHICULOS,
  type FiltroVehiculos,
} from '../../utils/dataGrouping';
import { CompanyList } from './CompanyList';
import { CompanyListHeader } from './CompanyListHeader';
import { ALTO_FILA_EMPRESA, CompanyRow } from './CompanyRow';
import type { FilaRegion } from './RegionList';
import { SearchBox } from './SearchBox';

const nf = new Intl.NumberFormat('es-ES');

/**
 * Paradas del máximo: las mismas que las del mínimo, con "sin máximo" en el
 * índice 0 — el deslizable arranca a la izquierda, en reposo, y cuanto más se
 * tira hacia la derecha más generoso es el techo.
 */
const PASOS_MAXIMO: readonly (number | null)[] = [null, ...PASOS_VEHICULOS];

/** Índice de la parada más cercana a un valor, para colocar el pulgar. */
function indiceMasCercano(pasos: readonly (number | null)[], valor: number, desde = 0): number {
  let mejor = desde;
  for (let i = desde + 1; i < pasos.length; i++) {
    if (Math.abs(pasos[i]! - valor) < Math.abs(pasos[mejor]! - valor)) mejor = i;
  }
  return mejor;
}

interface Props {
  /** Empresas del ámbito (provincia o comunidad) que ya cumplen el filtro, ya ordenadas. */
  empresas: Empresa[];
  filtro: FiltroVehiculos;
  orden: Orden;
  onCambiarOrden: (orden: Orden) => void;
  onCambiarFiltro: (filtro: FiltroVehiculos) => void;
  /**
   * Empresa elegida en la búsqueda global: va fijada encima del listado, pase
   * o no el filtro vigente. Esconder justo la empresa que el usuario acaba de
   * pulsar desmentiría al buscador; si no entra en el filtro, una nota dice
   * por qué.
   */
  empresaElegida?: Empresa | null;
  /**
   * Solo en vista de comunidad: desglose por provincia para acotar el listado
   * sin navegar (el mapa se queda en el zoom de la comunidad). `null` en
   * `provinciaFacet` es "todas".
   */
  facetsProvincia?: FilaRegion[];
  provinciaFacet?: string | null;
  onCambiarFacet?: (cod: string | null) => void;
}

/**
 * Listado de un ámbito (provincia o comunidad) con su buscador, filtros y
 * orden.
 *
 * La consulta y el desplegable viven aquí y no en `App` porque `Sidebar` monta
 * este componente con `key` = ámbito: al cambiar de provincia o de comunidad
 * se remonta y el buscador arranca limpio. El filtro de vehículos y el orden
 * sí viven en `App`: son globales y sobreviven al cambio.
 */
export function CompanyPanel({
  empresas,
  filtro,
  orden,
  onCambiarOrden,
  onCambiarFiltro,
  empresaElegida = null,
  facetsProvincia,
  provinciaFacet = null,
  onCambiarFacet,
}: Props) {
  const [consulta, setConsulta] = useState('');
  // El filtrado va contra el valor diferido: teclear nunca espera al listado.
  const diferida = useDeferredValue(consulta);
  const buscando = terminosDe(diferida).length > 0;

  const visibles = useMemo(() => filtrarPorTexto(empresas, diferida), [empresas, diferida]);

  // Mismos objetos que en el dataset: la igualdad por referencia vale.
  const elegidaEnListado = empresaElegida !== null && empresas.includes(empresaElegida);
  const motivoFueraDelFiltro =
    empresaElegida === null || elegidaEnListado
      ? null
      : `No entra en el listado: fuera del filtro de vehículos (${etiquetaFiltro(filtro)}).`;

  // Cerrado por defecto: en la hoja móvil cada fila de cabecera fija le resta
  // espacio real al listado. Solo el buscador y los chips (la vía para "ver
  // por comunidad") se quedan siempre a la vista; el resto es un desplegable.
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const idMin = useId();
  const idMax = useId();

  // Los dos extremos no se cruzan: mover uno arrastra al otro si hace falta.
  const cambiarMinimo = (min: number) =>
    onCambiarFiltro({ min, max: filtro.max !== null && filtro.max < min ? min : filtro.max });
  const cambiarMaximo = (max: number | null) =>
    onCambiarFiltro({ min: max !== null && max < filtro.min ? max : filtro.min, max });

  // Los controles son la primera fila del listado (ver `CompanyList`): suben
  // con las empresas al hacer scroll en vez de quedarse fijos encima.
  const cabecera = (
    <>
      <SearchBox
        consulta={consulta}
        onCambiar={setConsulta}
        placeholder="Nombre, autorización o localidad…"
        etiqueta="Buscar empresa por razón social, número de autorización, localidad o código postal"
      />

      {facetsProvincia && facetsProvincia.length > 1 && (
        <FacetsProvincia
          facets={facetsProvincia}
          activa={provinciaFacet}
          onElegir={onCambiarFacet}
        />
      )}

      {empresaElegida && (
        <div className="shrink-0 border-b border-atencion/50 bg-atencion/10">
          <p className="px-4 pt-2 text-caption uppercase tracking-[0.08em] text-asfalto">
            Resultado de la búsqueda en toda España
          </p>
          <CompanyRow empresa={empresaElegida} style={{ height: ALTO_FILA_EMPRESA }} />
          {motivoFueraDelFiltro && (
            <p className="px-4 pb-2 text-caption text-asfalto">{motivoFueraDelFiltro}</p>
          )}
        </div>
      )}

      <div className="shrink-0 border-b border-ink/10">
        <button
          type="button"
          onClick={() => setOpcionesAbiertas((v) => !v)}
          aria-expanded={opcionesAbiertas}
          className="flex w-full items-center justify-between gap-3 px-4 py-1.5 text-caption text-asfalto transition-colors duration-150 hover:text-ink"
        >
          <span>
            <Latido valor={visibles.length} className="font-mono tabular-nums">
              {nf.format(visibles.length)}
            </Latido>
            {buscando && (
              <>
                {' '}
                de <span className="font-mono tabular-nums">{nf.format(empresas.length)}</span>
              </>
            )}{' '}
            {visibles.length === 1 ? 'empresa' : 'empresas'}
          </span>

          <span className="flex items-center gap-1 font-medium uppercase tracking-[0.08em] text-atencion">
            Filtros y orden
            {filtroActivo(filtro) && (
              <span className="size-1.5 rounded-full bg-atencion" aria-hidden="true" />
            )}
            <ChevronDown
              aria-hidden="true"
              className={`size-3.5 transition-transform duration-150 ${opcionesAbiertas ? 'rotate-180' : ''}`}
              strokeWidth={1.75}
            />
          </span>
        </button>

        <Desplegable abierto={opcionesAbiertas}>
          {/* Tarjeta tintada: los mandos se agrupan en su propia lámina de color. */}
          <div className="mx-4 mb-3 flex flex-col gap-2.5 rounded-xl bg-atencion/6 p-3">
            <Deslizable
              id={idMin}
              etiqueta="Mínimo de vehículos"
              valor={filtro.min === 1 ? 'Sin mínimo' : nf.format(filtro.min)}
              indice={indiceMasCercano(PASOS_VEHICULOS, filtro.min)}
              ultimo={PASOS_VEHICULOS.length - 1}
              lectura={filtro.min === 1 ? 'sin mínimo' : `${filtro.min} vehículos como mínimo`}
              onCambiar={(i) => cambiarMinimo(PASOS_VEHICULOS[i]!)}
            />

            <Deslizable
              id={idMax}
              etiqueta="Máximo de vehículos"
              valor={filtro.max === null ? 'Sin máximo' : nf.format(filtro.max)}
              indice={filtro.max === null ? 0 : indiceMasCercano(PASOS_MAXIMO, filtro.max, 1)}
              ultimo={PASOS_MAXIMO.length - 1}
              lectura={filtro.max === null ? 'sin máximo' : `${filtro.max} vehículos como máximo`}
              onCambiar={(i) => cambiarMaximo(PASOS_MAXIMO[i] ?? null)}
            />

            <CompanyListHeader orden={orden} onCambiarOrden={onCambiarOrden} />
          </div>
        </Desplegable>
      </div>
    </>
  );

  return (
    <CompanyList
      empresas={visibles}
      cabecera={cabecera}
      mensajeVacio={
        empresas.length === 0
          ? 'Ninguna empresa de este ámbito entra en el filtro de vehículos. Ajústalo en «Filtros y orden».'
          : `Sin resultados para «${diferida.trim()}».`
      }
    />
  );
}

/** Deslizable por paradas, con su etiqueta y el valor elegido a la vista. */
function Deslizable({
  id,
  etiqueta,
  valor,
  indice,
  ultimo,
  lectura,
  onCambiar,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  indice: number;
  ultimo: number;
  /** Lo que oye un lector de pantalla en vez del índice de la parada. */
  lectura: string;
  onCambiar: (indice: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-body-sm">
        <label htmlFor={id}>{etiqueta}</label>
        <span className="font-mono tabular-nums text-asfalto">{valor}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={ultimo}
        step={1}
        value={indice}
        onChange={(e) => onCambiar(Number(e.target.value))}
        aria-valuetext={lectura}
        className="w-full accent-atencion"
      />
    </div>
  );
}

/**
 * Despliegue con física: la altura se abre con GSAP y las filas de dentro
 * entran escalonadas, en vez de aparecer todo de golpe. El contenido queda
 * siempre montado (con `inert` mientras está cerrado, para que el tabulador
 * no se cuele en controles invisibles); lo que se anima es solo la caja.
 */
function Desplegable({ abierto, children }: { abierto: boolean; children: ReactNode }) {
  const quieto = useMenosMovimiento();
  const cajaRef = useRef<HTMLDivElement>(null);
  const primera = useRef(true);

  useLayoutEffect(() => {
    const caja = cajaRef.current;
    if (!caja) return;

    // Sin animar cuando no hay nadie mirando: el primer pintado no es una
    // acción del usuario, con menos movimiento pedido se salta, y en una
    // pestaña oculta el rAF está congelado y el tween se quedaría a medias.
    if (primera.current || quieto || document.hidden) {
      primera.current = false;
      gsap.set(caja, { height: abierto ? 'auto' : 0 });
      return;
    }

    if (abierto) {
      gsap.fromTo(
        caja,
        { height: 0 },
        { height: 'auto', duration: 0.35, ease: 'power2.out', clearProps: 'height' },
      );
      const filas = caja.querySelectorAll(':scope > div > *');
      gsap.fromTo(
        filas,
        { opacity: 0, y: -6 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out', clearProps: 'all' },
      );
    } else {
      gsap.to(caja, { height: 0, duration: 0.25, ease: 'power2.in' });
    }
  }, [abierto, quieto]);

  return (
    <div ref={cajaRef} inert={!abierto} className="overflow-hidden" style={{ height: 0 }}>
      {children}
    </div>
  );
}

/**
 * Desglose por provincia dentro de una comunidad, como chips: acota el
 * listado sin tocar el mapa (que se queda en el zoom de la comunidad). Es la
 * vía para "ver por comunidad sin bajar a una provincia" y, a la vez, para
 * acotar a una si hace falta — el mismo control cubre las dos preguntas.
 */
function FacetsProvincia({
  facets,
  activa,
  onElegir,
}: {
  facets: FilaRegion[];
  activa: string | null;
  onElegir?: (cod: string | null) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Acotar a una provincia"
      className="flex shrink-0 flex-wrap gap-1.5 border-b border-ink/10 px-4 py-2.5"
    >
      <Chip activo={activa === null} onClick={() => onElegir?.(null)}>
        Todas
      </Chip>
      {facets.map((f) => (
        <Chip key={f.cod} activo={activa === f.cod} onClick={() => onElegir?.(f.cod)}>
          {f.nombre}{' '}
          <Latido valor={f.cumplen} className="font-mono tabular-nums">
            {nf.format(f.cumplen)}
          </Latido>
        </Chip>
      ))}
    </div>
  );
}

/**
 * Chip con física (`Pulsable`): se eleva al apuntarlo y se hunde con resorte
 * al pulsarlo. El activo se enciende en el acento del filtro activo.
 */
function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Pulsable
      type="button"
      elevado
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-full border px-3 py-1 text-caption transition-colors duration-150 ${
        activo
          ? 'border-atencion bg-linear-to-b from-atencion-vivo to-atencion font-medium text-superficie'
          : 'border-transparent bg-atencion/10 text-atencion hover:bg-atencion/15'
      }`}
    >
      {children}
    </Pulsable>
  );
}
