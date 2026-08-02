# Master prompt para Claude Code

Copia y pega esto tal cual como primer mensaje, con `CLAUDE_BRIEF.md` y
`DESIGN_SYSTEM.md` ya en la raíz del proyecto.

---

Vas a construir una web: un mapa interactivo de España para explorar empresas de
transporte de mercancías por CCAA y provincia. Lee primero `CLAUDE_BRIEF.md` (qué es
el producto, datos disponibles, funcionalidad) y `DESIGN_SYSTEM.md` (colores, tipografía,
layout, animaciones — ya están decididos, síguelos, no propongas una dirección distinta).

## Arquitectura

- **React + Vite + TypeScript**. TypeScript porque manejamos ~45.000 registros con una
  forma de datos concreta (empresa, CCAA, provincia) y conviene tipar bien desde el inicio.
- **TailwindCSS**, configurado con los tokens de color y tipografía de `DESIGN_SYSTEM.md`
  en `tailwind.config.js` (no hardcodear hex sueltos por los componentes).
- **Leaflet** (`react-leaflet`) para el mapa, con capas GeoJSON de CCAA y provincias.
  No uses Mapbox (requiere API key y no la necesitamos para un mapa coroplético estático).
- **Sin backend para el MVP.** Los datos se procesan en build time desde el Excel de SABI
  a un JSON estático agrupado por CCAA → provincia. Todo el filtrado (slider de empleados,
  búsqueda de texto) ocurre en cliente, en memoria.
- **Despliegue en Vercel.**

## Estructura de carpetas

```
/scripts
  process-sabi-export.js   # Node script: Excel de SABI -> /src/data/companies.json
/src
  /components
    /map
      SpainMap.tsx
      ChoroplethLayer.tsx
      MapLegend.tsx
      RouteTraceOverlay.tsx      # elemento de firma: trazado de borde animado
    /sidebar
      Sidebar.tsx
      Breadcrumb.tsx
      SearchBox.tsx
      CompanyList.tsx           # virtualizada (react-window o similar)
      CompanyRow.tsx
    /layout
      Header.tsx
      StatsCounter.tsx
      EmployeeThresholdSlider.tsx
      Footer.tsx
  /data
    ccaa.geojson
    provincias.geojson
    companies.json              # generado por el script, no editar a mano
  /hooks
    useFilteredCompanies.ts
    useMapNavigation.ts          # estado: nivel (nacional/CCAA/provincia), región activa
  /types
    company.ts                  # interfaces: Company, CCAA, Provincia
  /utils
    dataGrouping.ts
    choroplethScale.ts
  App.tsx
  main.tsx
```

## Plan de construcción (en fases, no todo de golpe)

**Fase 1 — Datos**
Escribe `process-sabi-export.js`: lee el Excel de SABI, normaliza columnas (nombre, NIF,
provincia, CCAA, empleados, CNAE), agrupa por CCAA/provincia, exporta `companies.json`
con esa estructura. Valida que los nombres de provincia/CCAA del Excel casen con los
`properties` de los GeoJSON (a veces hay diferencias de tildes/nomenclatura — normaliza).

**Fase 2 — Mapa estático**
Monta el mapa base con Leaflet, carga las capas GeoJSON de CCAA, aplica la coropleta según
nº de empresas que cumplen un umbral de empleados fijo de prueba (ej. ≥4). Sin interacción
todavía, solo que se vea correcto y con los colores de `DESIGN_SYSTEM.md`.

**Fase 3 — Navegación e interacción**
Clic en CCAA → `flyTo`/`fitBounds` + cambia a capa de provincias de esa CCAA + trazado de
borde animado (elemento de firma). Breadcrumb funcional para volver atrás. Clic en
provincia → abre el panel lateral con el listado de esa provincia.

**Fase 4 — Filtros y listado**
Slider de umbral de empleados (afecta coropleta y contadores en tiempo real, con debounce
si hace falta por rendimiento). Buscador de texto en el listado de empresas. Contador
global y por región siempre visible. Panel de empresa: nombre, NIF (mono), localidad,
empleados.

**Fase 5 — Pulido**
Animaciones finas según `DESIGN_SYSTEM.md` (timings exactos ya especificados ahí).
Responsive: bottom sheet en tablet/móvil según el layout del sistema de diseño.
`prefers-reduced-motion` respetado. Foco de teclado visible en todos los controles.
Nota discreta en el footer explicando que el nº de empleados es un proxy del tamaño de
flota, no un dato exacto de vehículos (ver `CLAUDE_BRIEF.md`, sección "qué no hacer").

## Antes de escribir código

Enséñame capturas o describe en texto cómo van a quedar el mapa con la coropleta y el
panel lateral con un par de empresas de ejemplo, antes de construir todas las fases.
Prefiero corregir la dirección en ese punto que después de tener las 5 fases montadas.

## Al terminar cada fase

Para de forma explícita, enséñame qué has hecho y qué decisiones tomaste que no estaban
100% especificadas en los documentos, antes de pasar a la siguiente fase.
