# Brief: Mapa interactivo de transportistas por España

## Qué es esto
Herramienta web (no landing de marketing) para un cliente del sector transporte/logística.
Permite explorar empresas de transporte de mercancías por carretera en España, navegando
por Comunidad Autónoma y Provincia, filtrando por tamaño (proxy de flota vía nº de empleados).

Es un instrumento de consulta, no un escaparate. Prioriza claridad y velocidad de uso sobre
decoración. La persona que lo usa quiere encontrar transportistas rápido, no "disfrutar" del sitio.

## Datos disponibles
Un Excel exportado de SABI (Bureau van Dijk) con ~45.000 empresas, CNAE 4941/4939, columnas:
- Nombre / Razón social
- NIF
- Calle, Código postal, Localidad
- Provincia
- Comunidad autónoma
- Nº de empleados (último año disponible)
- CNAE

Importante: SABI NO tiene el número real de camiones/flota por empresa (no existe como dato
descargable masivamente en ninguna fuente pública o privada en España). Se usa el nº de
empleados como proxy razonable de tamaño de flota. El filtro objetivo del cliente
("≥5 camiones") se traduce provisionalmente a un umbral de empleados a definir
(sugerencia inicial: ≥4-5 empleados, a validar con una muestra contra el registro REAT
del Ministerio de Transportes antes de lanzar a producción).

## Stack técnico recomendado
- **Frontend:** React + Vite + TailwindCSS
- **Mapa:** Leaflet (ligero, gratuito, sin API key) con capas GeoJSON de:
  - Comunidades Autónomas de España (17)
  - Provincias de España (52)
  Fuentes de GeoJSON a evaluar: repos públicos como `martgnz/ccaa-geojson` o
  `codeforgermany/click_that_hood` (verificar licencia y precisión de límites antes de usar).
- **Datos:** procesar el Excel de SABI a JSON estático (agrupado por CCAA → Provincia → lista
  de empresas) en build time. No hace falta backend/base de datos para el MVP; los datos no
  cambian en tiempo real.
- **Búsqueda/filtrado en cliente:** todo en memoria vía JS (45k registros es manejable sin backend).
- **Despliegue:** Vercel.

Si más adelante el cliente quiere actualizar datos periódicamente sin re-desplegar código,
entonces sí se plantea backend + base de datos (Postgres) con endpoint de consulta. Para el
MVP no es necesario.

## Funcionalidad
1. Mapa de España con las 17 CCAA visibles por defecto, coloreadas según nº de empresas
   que cumplen el filtro (coropletas).
2. Clic en una CCAA → zoom a esa comunidad, se muestran sus provincias.
3. Clic en una provincia → panel lateral (o modal) con listado de empresas de esa provincia
   que cumplen el filtro, con nombre, NIF, localidad y empleados.
4. Filtro global visible siempre: umbral mínimo de empleados (slider o input), controla en
   tiempo real qué empresas se cuentan/muestran.
5. Buscador de texto libre por nombre de empresa dentro del listado.
6. Botón para volver de "vista provincia" a "vista nacional".
7. Contador visible en todo momento: "X empresas cumplen el filtro actual" (nacional y,
   si se está dentro de una provincia, también el de esa provincia).

## Dirección de diseño (abierta, no cerrada)
No uses un look genérico de landing de IA (fondo crema + serif + acento terracota; o negro
con acento neón; o broadsheet con reglas finas). Este es un producto de datos del sector
transporte/logística español — explora esa identidad visual: señalética de carretera,
paneles de control logístico, cartografía funcional. Tipografía muy legible, paleta
contenida (3-4 colores + escala de grises), el mapa como protagonista absoluto.

Antes de construir, plantea 2 conceptos de dirección visual distintos (paleta, tipografía,
cómo se resuelve la coropleta y el panel lateral) y elige el que mejor sirva a la función
antes de escribir código.

## Restricciones
- Responsive: tiene que funcionar razonablemente en tablet como mínimo (uso probable en
  oficina, no tanto en móvil, pero no lo rompas en pantallas pequeñas).
- Accesibilidad básica: foco de teclado visible, contraste de color suficiente en la coropleta
  (que no dependa solo del color para diferenciar rangos — añadir algún patrón o valor
  numérico visible).
- Rendimiento: con 45k registros en memoria, cuidado con re-renders innecesarios al mover
  el slider de filtro — usa debounce o memoización donde haga falta.

## Qué NO hacer
- No inventes datos de flota/camiones que no existen en el dataset.
- No asumas que el proxy de empleados es exacto; el copy de la interfaz debe dejar claro
  que es una estimación (ej. tooltip o nota discreta, sin ser alarmista).
- No añadas features fuera de este alcance (login, pagos, CRM) salvo que se pida explícitamente.
