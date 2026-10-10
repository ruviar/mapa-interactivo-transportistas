# mapa-interactivo-transportistas

Mapa de las empresas de transporte de mercancías por carretera de España, por
comunidad autónoma y provincia, con el nº de vehículos de cada autorización.

React + Vite + Tailwind + Leaflet. Sin backend: los datos son un JSON estático
generado a mano desde el fichero del Ministerio.

## Datos

**Fuente:** Ministerio de Transportes y Movilidad Sostenible — «Personas
jurídicas con autorización MDPE» (expediente 960239), facilitado por el propio
Ministerio. Cada fila es una autorización en alta: razón social, municipio,
provincia, código postal, nº de autorización, fecha de alta o actualización y
vehículos adscritos. El fichero no incluye NIF.

### Reutilización (Ley 37/2007)

Es información del sector público reutilizada, también con fines comerciales,
bajo las condiciones generales de la ley. Así se cumple cada una:

| Condición | Dónde |
| --- | --- |
| No desnaturalizar los datos | `scripts/procesar-registro-mdpe.js` no descarta, corrige ni completa ninguna fila, y falla si alguna no se puede leer. Solo limpia la forma: espacios de relleno y el artículo pospuesto de los municipios (`EJIDO (EL)` → `EL EJIDO`). |
| Citar la fuente | Panel de la herramienta y pie de la landing (`src/utils/fuente.ts`). |
| Indicar la fecha de última actualización | Misma cita. La fecha es la más reciente de alta o actualización que trae el fichero; se calcula sola. |
| No dar a entender que el Ministerio respalda la web | Aviso en el pie de la landing. |

### Actualizar los datos

1. Sustituir `data-source/registro-mdpe.xlsx` por el fichero nuevo (no se
   versiona; los JSON generados sí).
2. `npm run data` — regenera `public/data/companies.json`,
   `src/data/regiones.json` y `src/data/fuente.json`.
3. `npm test` — si cambian los recuentos por comunidad, el test dice qué
   valores pegar en `src/landing/datos/recuentosPreview.ts`.
4. Commit y push: Vercel despliega solo.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:5173 — la herramienta está en /?app
npm test
npm run build
```
