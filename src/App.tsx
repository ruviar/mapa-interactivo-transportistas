import type { Map as LeafletMap } from 'leaflet';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { ConectorSeleccion } from './components/map/ConectorSeleccion';
import { SpainMap } from './components/map/SpainMap';
import type { Segmento } from './components/sidebar/Breadcrumb';
import type { FilaRegion } from './components/sidebar/RegionList';
import { Sidebar } from './components/sidebar/Sidebar';
import { useBottomSheet } from './hooks/useBottomSheet';
import { useDataset } from './hooks/useDataset';
import { ORDEN_INICIAL, useFilteredCompanies, type Orden } from './hooks/useFilteredCompanies';
import { useMapNavigation } from './hooks/useMapNavigation';
import { useProvincias } from './hooks/useProvincias';
import regiones from './data/regiones.json';
import type { Regiones } from './types/company';
import { calcularCortes } from './utils/choroplethScale';
import { contar, cumplenPorRegion, UMBRAL_INICIAL, type Conteo } from './utils/dataGrouping';

const REGIONES = regiones as Regiones;
const NOMBRE_CCAA = new Map(REGIONES.ccaa.map((c) => [c.cod, c.nombre]));

/** Una vez por pestaña: si ya se ha navegado, la pista inicial no vuelve a salir. */
const CLAVE_PISTA = 'mapa-interactuado';
const NOMBRE_PROVINCIA = new Map(REGIONES.provincias.map((p) => [p.cod, p.nombre]));

const porTamano = (a: FilaRegion, b: FilaRegion) =>
  b.cumplen - a.cumplen || a.nombre.localeCompare(b.nombre, 'es');

/** Aragón › Zaragoza: la comunidad y provincia de ejemplo del scrollytelling de `SeccionMapa`. */
const DEMO_CCAA = '02';
const DEMO_PROVINCIA = '50';
const DEMO_UMBRAL = 5;

export interface DemoMapa {
  /** Paso activo del scrollytelling; `null` = fuera del recorrido, vuelve a España. */
  paso: 1 | 2 | 3 | null;
}

interface Props {
  /**
   * Presente solo cuando `App` vive dentro de `SeccionMapa.tsx`: el texto del
   * scrollytelling pilota el mapa real a través de las funciones de
   * navegación que ya existen (`nav.irACCAA`, `setUmbral`…), no añade estado
   * de dominio nuevo. Sin esta prop —el caso normal, `?app`— el efecto de
   * abajo no hace nada y el comportamiento no cambia un pelo.
   */
  demo?: DemoMapa;
}

/**
 * Fase 5 — pulido. Lo de la Fase 4 (España › comunidad › provincia, umbral y
 * buscador) con dos formas: columna fija en escritorio y hoja inferior sobre el
 * mapa a pantalla completa en tablet y móvil.
 */
export default function App({ demo }: Props = {}) {
  const carga = useDataset();
  const dataset = carga.estado === 'listo' ? carga.dataset : null;

  const nav = useMapNavigation(REGIONES);
  const { vista } = nav;
  const provinciasGeo = useProvincias();
  const hoja = useBottomSheet(nav.clave, vista.nivel);

  // La instancia de Leaflet y la cabecera del panel, para `ConectorSeleccion`:
  // vive fuera de los dos árboles y necesita un punto de partida y uno de
  // llegada que ninguno de los dos componentes puede darle por prop normal.
  const mapaRef = useRef<LeafletMap | null>(null);
  const tituloRef = useRef<HTMLHeadingElement | null>(null);

  // Lee sessionStorage una sola vez, en el inicializador: así una pestaña que
  // ya ha navegado no llega a ver la pista ni un fotograma antes de apagarse.
  const [pistaActiva, setPistaActiva] = useState(() => !sessionStorage.getItem(CLAVE_PISTA));
  const apagarPista = useCallback(() => {
    sessionStorage.setItem(CLAVE_PISTA, '1');
    setPistaActiva(false);
  }, []);
  const alSeleccionarCCAA = useCallback(
    (cod: string) => {
      apagarPista();
      nav.irACCAA(cod);
    },
    [apagarPista, nav],
  );
  const alSeleccionarProvincia = useCallback(
    (cod: string) => {
      apagarPista();
      nav.irAProvincia(cod);
    },
    [apagarPista, nav],
  );

  const [umbral, setUmbral] = useState(UMBRAL_INICIAL);
  // Recontar 42.839 empresas y repintar 52 polígonos en cada píxel del slider
  // atascaría el pulgar. Con el valor diferido el control responde al instante
  // y el mapa llega un fotograma después, que es justo lo que se quiere.
  const umbralAplicado = useDeferredValue(umbral);

  // Puente del scrollytelling: orquesta el estado que ya existe (no añade
  // ninguno de dominio nuevo). Fuera de `SeccionMapa` `demo` es `undefined` y
  // esto no hace nada.
  useEffect(() => {
    if (!demo) return;
    if (demo.paso === null) {
      nav.irANacional();
      return;
    }
    nav.irACCAA(DEMO_CCAA);
    if (demo.paso >= 2) setUmbral(DEMO_UMBRAL);
    if (demo.paso === 3) nav.irAProvincia(DEMO_PROVINCIA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo?.paso]);

  const recuentos = useMemo(
    () => (dataset ? contar(dataset, REGIONES, umbralAplicado) : null),
    [dataset, umbralAplicado],
  );

  const cumplenCCAA = useMemo(() => recuentos && cumplenPorRegion(recuentos.ccaa), [recuentos]);
  const cumplenProvincias = useMemo(
    () => recuentos && cumplenPorRegion(recuentos.provincias),
    [recuentos],
  );

  const cortesCCAA = useMemo(
    () => calcularCortes(cumplenCCAA ? Object.values(cumplenCCAA) : []),
    [cumplenCCAA],
  );
  // Los cortes de provincia se calculan sobre las 52, no sobre las de la
  // comunidad abierta: así el color de una provincia significa lo mismo en todo
  // el país y se pueden comparar dos comunidades entre sí.
  const cortesProvincias = useMemo(
    () => calcularCortes(cumplenProvincias ? Object.values(cumplenProvincias) : []),
    [cumplenProvincias],
  );

  // El orden vive aquí y no en `CompanyPanel`: ese se remonta al cambiar de
  // provincia (para vaciar el buscador) y devolvería el listado al alfabético
  // a quien acaba de pedir explícitamente el orden por tamaño.
  const [orden, setOrden] = useState<Orden>(ORDEN_INICIAL);

  const empresas = useFilteredCompanies(
    dataset,
    vista.nivel === 'provincia' ? vista.provincia : null,
    umbralAplicado,
    orden,
  );

  const ambito: Conteo | null = useMemo(() => {
    if (!recuentos) return null;
    if (vista.nivel === 'nacional') return recuentos.nacional;
    if (vista.nivel === 'ccaa') return recuentos.ccaa[vista.ccaa] ?? null;
    return recuentos.provincias[vista.provincia] ?? null;
  }, [recuentos, vista]);

  const segmentos: Segmento[] = useMemo(() => {
    const espana: Segmento = { etiqueta: 'España' };
    if (vista.nivel === 'nacional') return [espana];

    const comunidad: Segmento = { etiqueta: NOMBRE_CCAA.get(vista.ccaa) ?? '—' };
    if (vista.nivel === 'ccaa') return [{ ...espana, onVolver: nav.irANacional }, comunidad];

    return [
      { ...espana, onVolver: nav.irANacional },
      { ...comunidad, onVolver: () => nav.irACCAA(vista.ccaa) },
      { etiqueta: NOMBRE_PROVINCIA.get(vista.provincia) ?? '—' },
    ];
  }, [vista, nav]);

  const listaRegiones: FilaRegion[] = useMemo(() => {
    if (vista.nivel === 'nacional') {
      return REGIONES.ccaa
        .map((c) => ({ cod: c.cod, nombre: c.nombre, cumplen: cumplenCCAA?.[c.cod] ?? 0 }))
        .sort(porTamano);
    }
    if (vista.nivel === 'ccaa') {
      return REGIONES.provincias
        .filter((p) => p.ccaa === vista.ccaa)
        .map((p) => ({ cod: p.cod, nombre: p.nombre, cumplen: cumplenProvincias?.[p.cod] ?? 0 }))
        .sort(porTamano);
    }
    return [];
  }, [vista, cumplenCCAA, cumplenProvincias]);

  const titulo =
    vista.nivel === 'nacional'
      ? 'España'
      : vista.nivel === 'ccaa'
        ? (NOMBRE_CCAA.get(vista.ccaa) ?? '—')
        : (NOMBRE_PROVINCIA.get(vista.provincia) ?? '—');

  const cortes = vista.nivel === 'nacional' ? cortesCCAA : cortesProvincias;
  const ambitoCoropleta = vista.nivel === 'nacional' ? 'comunidad' : 'provincia';
  /** Franja inferior que ocupa el asomo de la hoja y que el mapa no invade. */
  const tapado = hoja.esHoja ? hoja.asomo : 0;

  return (
    // La caja que le den y nada de scroll de documento, también en móvil: allí
    // el panel es una hoja `fixed` y el pie no se dibuja, así que no hay nada
    // que se salga por abajo. Solo hacen scroll los listados.
    //
    // `h-full` y no `h-dvh`: suelta la herramienta es la ventana exacta (su
    // envoltorio en main.tsx pone el `h-dvh`), y dentro de la landing es el
    // panel que la enmarca quien decide el alto. Nada más cambia aquí.
    <div
      className="flex h-full flex-col overflow-hidden bg-base font-sans text-ink"
      // Alto del asomo, publicado para que el mapa sepa dónde acabar.
      style={{ '--asomo': `${tapado}px` } as CSSProperties}
    >
      <Header
        total={recuentos?.nacional.cumplen ?? null}
        umbral={umbral}
        onCambiarUmbral={setUmbral}
      />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* El mapa va en absoluto dentro de un contenedor relativo, y no como
            ítem flex con `h-full`: así su alto lo define una caja resuelta y no
            la negociación del flex, que ya dejó una vez el mapa en 0 px. */}
        <div className="relative min-h-0 min-w-0 flex-1">
          {/* Acaba donde empieza el asomo de la hoja, en vez de seguir por
              debajo y encuadrar con un margen inferior postizo: con `maxBounds`
              puesto, Leaflet recentra la vista y se come ese margen —el mapa
              quedaba con un tercio de vacío arriba. En escritorio `--asomo` es
              0 y esto es un `inset-0` normal. */}
          <div className="absolute inset-x-0 top-0 bottom-[var(--asomo,0px)]">
            <SpainMap
              vista={vista}
              clave={nav.clave}
              provinciasGeo={provinciasGeo}
              recuentosCCAA={cumplenCCAA}
              recuentosProvincias={cumplenProvincias}
              cortesCCAA={cortesCCAA}
              cortesProvincias={cortesProvincias}
              cargando={carga.estado === 'cargando'}
              pistaActiva={pistaActiva}
              mapaRef={mapaRef}
              onSeleccionarCCAA={alSeleccionarCCAA}
              onSeleccionarProvincia={alSeleccionarProvincia}
            />
          </div>

          {carga.estado === 'cargando' && (
            <Aviso>
              <span className="text-asfalto">Cargando el registro de empresas…</span>
            </Aviso>
          )}

          {carga.estado === 'error' && (
            <Aviso destacado>
              {carga.error.message}. Ejecuta <code className="font-mono">npm run data</code> para
              generar <code className="font-mono">public/data/companies.json</code>.
            </Aviso>
          )}
        </div>

        <Sidebar
          vista={vista}
          segmentos={segmentos}
          titulo={titulo}
          conteo={ambito}
          umbral={umbralAplicado}
          regiones={listaRegiones}
          empresas={empresas}
          orden={orden}
          cortes={cortes}
          ambitoCoropleta={ambitoCoropleta}
          datosListos={recuentos !== null}
          hoja={hoja}
          refTitulo={tituloRef}
          onCambiarOrden={setOrden}
          onSeleccionarRegion={vista.nivel === 'nacional' ? alSeleccionarCCAA : alSeleccionarProvincia}
        />
      </main>

      <ConectorSeleccion
        mapaRef={mapaRef}
        tituloRef={tituloRef}
        provinciasGeo={provinciasGeo}
        vista={vista}
        clave={nav.clave}
        activo={!hoja.esHoja}
      />

      <Footer cortes={cortes} ambito={ambitoCoropleta} activa={recuentos !== null} />
    </div>
  );
}

function Aviso({ children, destacado = false }: { children: React.ReactNode; destacado?: boolean }) {
  return (
    <p
      role="status"
      className={`pointer-events-none absolute left-5 top-5 z-[500] max-w-sm border-l-2 bg-base/90 px-3 py-2 text-body-sm ${
        destacado ? 'border-atencion' : 'border-asfalto/50'
      }`}
    >
      {children}
    </p>
  );
}
