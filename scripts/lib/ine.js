/**
 * Tablas INE de provincias y comunidades autónomas.
 *
 * El código INE es la clave de cruce entre el Excel de SABI y los GeoJSON:
 * los nombres NO sirven porque cada fuente los escribe distinto
 * (SABI: "a Coruña", "Jaen", "Alava" · GeoJSON: "A Coruña", "Jaén", "Araba/Álava").
 */

/** cod_ccaa INE -> nombre oficial */
export const CCAA = {
  '01': 'Andalucía',
  '02': 'Aragón',
  '03': 'Principado de Asturias',
  '04': 'Illes Balears',
  '05': 'Canarias',
  '06': 'Cantabria',
  '07': 'Castilla y León',
  '08': 'Castilla-La Mancha',
  '09': 'Cataluña',
  '10': 'Comunitat Valenciana',
  '11': 'Extremadura',
  '12': 'Galicia',
  '13': 'Comunidad de Madrid',
  '14': 'Región de Murcia',
  '15': 'Comunidad Foral de Navarra',
  '16': 'País Vasco',
  '17': 'La Rioja',
  '18': 'Ceuta',
  '19': 'Melilla',
};

/**
 * Nombre para rotular el mapa, cuando el oficial no cabe dentro de la región.
 * Solo aquí las que difieren; el resto rotula con su nombre oficial.
 */
export const CCAA_CORTO = {
  '03': 'Asturias',
  '04': 'Balears',
  '10': 'C. Valenciana',
  '13': 'Madrid',
  '14': 'Murcia',
  '15': 'Navarra',
};

/** Igual que CCAA_CORTO, para las provincias con nombre bilingüe o largo. */
export const PROVINCIA_CORTO = {
  '01': 'Álava',
  '03': 'Alicante',
  '07': 'Balears',
  '12': 'Castellón',
  '38': 'S.C. Tenerife',
  '46': 'Valencia',
};

/** cod_prov INE -> { nombre oficial, cod_ccaa } */
export const PROVINCIAS = {
  '01': { nombre: 'Araba/Álava', ccaa: '16' },
  '02': { nombre: 'Albacete', ccaa: '08' },
  '03': { nombre: 'Alicante/Alacant', ccaa: '10' },
  '04': { nombre: 'Almería', ccaa: '01' },
  '05': { nombre: 'Ávila', ccaa: '07' },
  '06': { nombre: 'Badajoz', ccaa: '11' },
  '07': { nombre: 'Illes Balears', ccaa: '04' },
  '08': { nombre: 'Barcelona', ccaa: '09' },
  '09': { nombre: 'Burgos', ccaa: '07' },
  '10': { nombre: 'Cáceres', ccaa: '11' },
  '11': { nombre: 'Cádiz', ccaa: '01' },
  '12': { nombre: 'Castellón/Castelló', ccaa: '10' },
  '13': { nombre: 'Ciudad Real', ccaa: '08' },
  '14': { nombre: 'Córdoba', ccaa: '01' },
  '15': { nombre: 'A Coruña', ccaa: '12' },
  '16': { nombre: 'Cuenca', ccaa: '08' },
  '17': { nombre: 'Girona', ccaa: '09' },
  '18': { nombre: 'Granada', ccaa: '01' },
  '19': { nombre: 'Guadalajara', ccaa: '08' },
  '20': { nombre: 'Gipuzkoa', ccaa: '16' },
  '21': { nombre: 'Huelva', ccaa: '01' },
  '22': { nombre: 'Huesca', ccaa: '02' },
  '23': { nombre: 'Jaén', ccaa: '01' },
  '24': { nombre: 'León', ccaa: '07' },
  '25': { nombre: 'Lleida', ccaa: '09' },
  '26': { nombre: 'La Rioja', ccaa: '17' },
  '27': { nombre: 'Lugo', ccaa: '12' },
  '28': { nombre: 'Madrid', ccaa: '13' },
  '29': { nombre: 'Málaga', ccaa: '01' },
  '30': { nombre: 'Murcia', ccaa: '14' },
  '31': { nombre: 'Navarra', ccaa: '15' },
  '32': { nombre: 'Ourense', ccaa: '12' },
  '33': { nombre: 'Asturias', ccaa: '03' },
  '34': { nombre: 'Palencia', ccaa: '07' },
  '35': { nombre: 'Las Palmas', ccaa: '05' },
  '36': { nombre: 'Pontevedra', ccaa: '12' },
  '37': { nombre: 'Salamanca', ccaa: '07' },
  '38': { nombre: 'Santa Cruz de Tenerife', ccaa: '05' },
  '39': { nombre: 'Cantabria', ccaa: '06' },
  '40': { nombre: 'Segovia', ccaa: '07' },
  '41': { nombre: 'Sevilla', ccaa: '01' },
  '42': { nombre: 'Soria', ccaa: '07' },
  '43': { nombre: 'Tarragona', ccaa: '09' },
  '44': { nombre: 'Teruel', ccaa: '02' },
  '45': { nombre: 'Toledo', ccaa: '08' },
  '46': { nombre: 'Valencia/València', ccaa: '10' },
  '47': { nombre: 'Valladolid', ccaa: '07' },
  '48': { nombre: 'Bizkaia', ccaa: '16' },
  '49': { nombre: 'Zamora', ccaa: '07' },
  '50': { nombre: 'Zaragoza', ccaa: '02' },
  '51': { nombre: 'Ceuta', ccaa: '18' },
  '52': { nombre: 'Melilla', ccaa: '19' },
};

/** minúsculas, sin tildes, sin puntuación, espacios colapsados */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Grafías alternativas que aparecen en SABI, en los GeoJSON o en uso común.
 * Las formas oficiales (y cada mitad de las bilingües "X/Y") se añaden solas.
 */
const ALIAS = {
  '01': ['alava', 'araba'],
  '03': ['alacant'],
  '07': ['baleares', 'islas baleares', 'illes balears'],
  '12': ['castello', 'castellon de la plana'],
  '15': ['coruna', 'la coruna'],
  '17': ['gerona'],
  '20': ['guipuzcoa', 'guipuzkoa'],
  '25': ['lerida'],
  '32': ['orense'],
  '33': ['principado de asturias', 'oviedo'],
  '35': ['las palmas de gran canaria', 'gran canaria'],
  '38': ['tenerife', 'sta cruz de tenerife'],
  '39': ['santander'],
  '46': ['valencia'],
  '48': ['vizcaya', 'bizkaia'],
  '31': ['comunidad foral de navarra', 'nafarroa'],
  '26': ['rioja', 'logrono'],
  '30': ['region de murcia'],
  '28': ['comunidad de madrid'],
};

/** índice nombre-normalizado -> cod_prov */
const INDICE = (() => {
  const idx = new Map();
  const add = (clave, cod) => {
    const k = normalizar(clave);
    if (!k) return;
    const previo = idx.get(k);
    if (previo && previo !== cod) {
      throw new Error(`Alias ambiguo "${k}": ${previo} y ${cod}`);
    }
    idx.set(k, cod);
  };
  for (const [cod, { nombre }] of Object.entries(PROVINCIAS)) {
    add(nombre, cod);
    for (const parte of nombre.split('/')) add(parte, cod);
  }
  for (const [cod, alias] of Object.entries(ALIAS)) {
    if (!PROVINCIAS[cod]) continue;
    for (const a of alias) add(a, cod);
  }
  return idx;
})();

/** Nombre de provincia (cualquier grafía conocida) -> cod_prov INE. null si no se reconoce. */
export function codigoProvincia(nombre) {
  const clave = normalizar(nombre);
  if (!clave) return null;
  const directo = INDICE.get(clave);
  if (directo) return directo;
  // Nombres bilingües con barra ("Gipuzkoa/Guipúzcoa"): vale con que case una mitad.
  for (const parte of String(nombre).split('/')) {
    const cod = INDICE.get(normalizar(parte));
    if (cod) return cod;
  }
  return null;
}

/** cod_prov -> cod_ccaa */
export function codigoCCAA(codProv) {
  return PROVINCIAS[codProv]?.ccaa ?? null;
}
