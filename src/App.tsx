import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';

import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { MapErrorBoundary } from './components/map/MapErrorBoundary';
import { SpainMap } from './components/map/SpainMap';
import type { Segmento } from './components/sidebar/Breadcrumb';
import type { FilaRegion } from './components/sidebar/RegionList';
import { Sidebar } from './components/sidebar/Sidebar';
import { useBottomSheet } from './hooks/useBottomSheet';
import { useDataset } from './hooks/useDataset';
import {
  ORDEN_INICIAL,
  useFilteredCompanies,
  type AmbitoListado,
  type Orden,
} from './hooks/useFilteredCompanies';
import { useMapNavigation } from './hooks/useMapNavigation';
import { useProvincias } from './hooks/useProvincias';
import regiones from './data/regiones.json';
import type { CodProvincia, Empresa, Regiones } from './types/company';
import { terminosDe } from './utils/busqueda';
import { buscarEnIndice, indiceDe } from './utils/busquedaGlobal';
import { calcularCortes } from './utils/choroplethScale';
import {
  contar,
  cumplenPorRegion,
  FILTROS_LISTADO_INICIALES,
  FLOTA_INICIAL,
  UMBRAL_INICIAL,
  type Conteo,
  type FiltroFlota,
  type FiltrosListado,
} from './utils/dataGrouping';

const REGIONES = regiones as Regiones;
const NOMBRE_CCAA = new Map(REGIONES.ccaa.map((c) => [c.cod, c.nombre]));

/** Una vez por pestaña: si ya se ha navegado, la pista inicial no vuelve a salir. */
const CLAVE_PISTA = 'mapa-interactuado';
const NOMBRE_PROVINCIA = new Map(REGIONES.provincias.map((p) => [p.cod, p.nombre]));

const porTamano = (a: FilaRegion, b: FilaRegion) =>
  b.cumplen - a.cumplen || a.nombre.localeCompare(b.nombre, 'es');

/**
 * Fase 5 — pulido. Lo de la Fase 4 (España › comunidad › provincia, umbral y
 * buscador) con dos formas: columna fija en escritorio y hoja inferior sobre el
 * mapa a pantalla completa en tablet y móvil.
 */
export default function App() {
  const carga = useDataset();
  const dataset = carga.estado === 'listo' ? carga.dataset : null;

  const nav = useMapNavigation(REGIONES);
  const { vista } = nav;
  const provinciasGeo = useProvincias();
  const hoja = useBottomSheet(nav.clave, vista.nivel);

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
  /**
   * Empresa elegida en la búsqueda global. El panel de su provincia la enseña
   * fijada arriba, pase o no el filtro vigente: la mayoría de las activas no
   * tiene dato de tamaño y aterrizaría en un listado que la esconde, negando
   * al buscador que acababa de encontrarla. Navegar por el mapa o la lista la
   * suelta: eso es empezar de cero.
   */
  const [elegida, setElegida] = useState<Empresa | null>(null);

  const alSeleccionarProvincia = useCallback(
    (cod: string) => {
      apagarPista();
      setElegida(null);
      nav.irAProvincia(cod);
    },
    [apagarPista, nav],
  );
  /** El zoom se sale del encuadre del nivel actual hacia fuera (ver `NavegacionPorZoom`). */
  const alAlejarNivel = useCallback(() => nav.atras(), [nav]);

  // Fijo: ya no hay control en la interfaz para moverlo (ver `UMBRAL_INICIAL`
  // en `utils/dataGrouping.ts`). Sigue siendo el mínimo que colorea el mapa y
  // filtra los listados en todos los niveles.
  const umbral = UMBRAL_INICIAL;

  /** Fuente del dato de tamaño: mismo trato diferido que antes el umbral. */
  const [fuenteFlota, setFuenteFlota] = useState<FiltroFlota>(FLOTA_INICIAL);
  const fuenteAplicada = useDeferredValue(fuenteFlota);

  const recuentos = useMemo(
    () => (dataset ? contar(dataset, REGIONES, umbral, fuenteAplicada) : null),
    [dataset, umbral, fuenteAplicada],
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

  // ── Filtros avanzados del listado (no tocan la coropleta) ──────────────────
  // Máximo de tamaño e "incluir sin dato" son exclusivos del listado: amplían
  // o acotan lo que se ve en una lista sin resignificar de qué habla el mapa.
  const [umbralMax, setUmbralMax] = useState<number | null>(FILTROS_LISTADO_INICIALES.umbralMax);
  const umbralMaxAplicado = useDeferredValue(umbralMax);
  const [incluirSinDato, setIncluirSinDato] = useState(FILTROS_LISTADO_INICIALES.incluirSinDato);
  const incluirSinDatoAplicado = useDeferredValue(incluirSinDato);

  const filtrosListado: FiltrosListado = useMemo(
    () => ({
      umbralMin: umbral,
      umbralMax: umbralMaxAplicado,
      filtroFlota: fuenteAplicada,
      incluirSinDato: incluirSinDatoAplicado,
    }),
    [umbral, umbralMaxAplicado, fuenteAplicada, incluirSinDatoAplicado],
  );

  // ── Ámbito del listado: una provincia, o una comunidad entera ──────────────
  // Ver una comunidad no exige bajar a una provincia: se listan sus empresas
  // desde el primer clic, y el desglose por provincia (`facetsProvincia`, más
  // abajo) acota sin tocar el zoom del mapa.
  const ambitoProvincia: AmbitoListado | null = useMemo(
    () => (vista.nivel === 'provincia' ? { tipo: 'provincia', provincia: vista.provincia } : null),
    [vista],
  );
  const provinciasDeCcaaActual: CodProvincia[] = useMemo(() => {
    if (vista.nivel !== 'ccaa') return [];
    return REGIONES.ccaa.find((c) => c.cod === vista.ccaa)?.provincias ?? [];
  }, [vista]);
  const ambitoCCAA: AmbitoListado | null = useMemo(
    () => (vista.nivel === 'ccaa' ? { tipo: 'ccaa', provincias: provinciasDeCcaaActual } : null),
    [vista, provinciasDeCcaaActual],
  );

  const empresasProvincia = useFilteredCompanies(dataset, ambitoProvincia, filtrosListado, orden);
  // Sin acotar por provincia: es la base de los chips de desglose (sus
  // recuentos no deben moverse porque el usuario haya elegido un chip) y,
  // cuando no hay ninguno elegido, es directamente lo que se enseña.
  const empresasCCAA = useFilteredCompanies(dataset, ambitoCCAA, filtrosListado, orden);

  /** Provincia elegida en los chips de desglose de una comunidad. `null` = todas. */
  const [provinciaFacet, setProvinciaFacet] = useState<CodProvincia | null>(null);
  useEffect(() => {
    setProvinciaFacet(null);
  }, [vista.nivel === 'ccaa' ? vista.ccaa : null]);

  const facetsProvincia: FilaRegion[] = useMemo(() => {
    if (vista.nivel !== 'ccaa') return [];
    const cuentas = new Map<CodProvincia, number>();
    for (const e of empresasCCAA) cuentas.set(e.provincia, (cuentas.get(e.provincia) ?? 0) + 1);
    return provinciasDeCcaaActual
      .map((cod) => ({
        cod,
        nombre: NOMBRE_PROVINCIA.get(cod) ?? cod,
        cumplen: cuentas.get(cod) ?? 0,
      }))
      .sort(porTamano);
  }, [vista, empresasCCAA, provinciasDeCcaaActual]);

  const empresas = useMemo(() => {
    if (vista.nivel === 'provincia') return empresasProvincia;
    if (vista.nivel !== 'ccaa') return [];
    if (!provinciaFacet) return empresasCCAA;
    return empresasCCAA.filter((e) => e.provincia === provinciaFacet);
  }, [vista, empresasProvincia, empresasCCAA, provinciaFacet]);

  // ── Búsqueda global (toda España) ─────────────────────────────────────────
  // La consulta vive aquí y no en el panel: sobrevive a la navegación entre
  // niveles, igual que el orden. El texto va diferido como el umbral.
  const [consultaGlobal, setConsultaGlobal] = useState('');
  const consultaGlobalAplicada = useDeferredValue(consultaGlobal);
  const buscandoGlobal = terminosDe(consultaGlobalAplicada).length > 0;

  // El índice se precalienta en un rato ocioso tras llegar el dataset: así el
  // primer tecleo no paga los cientos de milisegundos de construirlo. Si el
  // usuario teclea antes del rato ocioso, `indiceDe` lo construye ahí mismo.
  useEffect(() => {
    if (!dataset) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const cancelar = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => indiceDe(dataset, NOMBRE_PROVINCIA));
    return () => cancelar(id);
  }, [dataset]);

  const resultadosGlobales = useMemo(
    () =>
      dataset && buscandoGlobal
        ? buscarEnIndice(indiceDe(dataset, NOMBRE_PROVINCIA), consultaGlobalAplicada)
        : [],
    [dataset, buscandoGlobal, consultaGlobalAplicada],
  );

  const alElegirResultado = useCallback(
    (empresa: Empresa) => {
      setElegida(empresa);
      apagarPista();
      nav.irAProvincia(empresa.provincia);
    },
    [apagarPista, nav],
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

  /** Comunidades navegables a nivel nacional. El desglose por provincia dentro
   *  de una comunidad lo da `facetsProvincia`, no esta lista. */
  const listaRegiones: FilaRegion[] = useMemo(() => {
    if (vista.nivel !== 'nacional') return [];
    return REGIONES.ccaa
      .map((c) => ({ cod: c.cod, nombre: c.nombre, cumplen: cumplenCCAA?.[c.cod] ?? 0 }))
      .sort(porTamano);
  }, [vista, cumplenCCAA]);

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
        fuente={fuenteFlota}
        hayVerificadas={(dataset?.meta.resumen.verificada ?? 0) > 0}
        onCambiarFuente={setFuenteFlota}
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
            <MapErrorBoundary resetKey={nav.clave} onReintentar={nav.irANacional}>
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
                onSeleccionarCCAA={alSeleccionarCCAA}
                onSeleccionarProvincia={alSeleccionarProvincia}
                onAlejarNivel={alAlejarNivel}
              />
            </MapErrorBoundary>
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
          umbral={umbral}
          umbralMax={umbralMaxAplicado}
          incluirSinDato={incluirSinDatoAplicado}
          regiones={listaRegiones}
          empresas={empresas}
          orden={orden}
          cortes={cortes}
          ambitoCoropleta={ambitoCoropleta}
          datosListos={recuentos !== null}
          hoja={hoja}
          consultaGlobal={consultaGlobal}
          resultadosGlobales={resultadosGlobales}
          buscandoGlobal={buscandoGlobal}
          nombresProvincia={NOMBRE_PROVINCIA}
          empresaElegida={
            elegida && vista.nivel === 'provincia' && elegida.provincia === vista.provincia
              ? elegida
              : null
          }
          facetsProvincia={facetsProvincia}
          provinciaFacet={provinciaFacet}
          onCambiarConsultaGlobal={setConsultaGlobal}
          onElegirResultado={alElegirResultado}
          onCambiarOrden={setOrden}
          onCambiarUmbralMax={setUmbralMax}
          onCambiarIncluirSinDato={setIncluirSinDato}
          onCambiarFacet={setProvinciaFacet}
          onSeleccionarRegion={alSeleccionarCCAA}
        />
      </main>

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
