import { test } from 'node:test';
import assert from 'node:assert/strict';

import { codigoProvincia, codigoCCAA, normalizar } from './lib/ine.js';
import {
  limpiarRazonSocial,
  normalizarMunicipio,
  normalizarCP,
  fechaDesdeSerial,
  parseVehiculos,
} from './lib/transformar.js';

test('las grafías habituales sin tilde cruzan con el código INE', () => {
  assert.equal(codigoProvincia('a Coruña'), '15');
  assert.equal(codigoProvincia('Jaen'), '23');
  assert.equal(codigoProvincia('Alava'), '01');
  assert.equal(codigoProvincia('Avila'), '05');
  assert.equal(codigoProvincia('Guipuzcoa'), '20');
  assert.equal(codigoProvincia('Vizcaya'), '48');
  assert.equal(codigoProvincia('Baleares'), '07');
  assert.equal(codigoProvincia('Las Palmas de Gran Canaria'), '35');
  assert.equal(codigoProvincia('Zaragoza'), '50');
});

test('las grafías de los GeoJSON cruzan con el mismo código', () => {
  assert.equal(codigoProvincia('A Coruña'), '15');
  assert.equal(codigoProvincia('Araba/Álava'), '01');
  assert.equal(codigoProvincia('Gipuzkoa/Guipúzcoa'), '20');
  assert.equal(codigoProvincia('Bizkaia/Vizcaya'), '48');
  assert.equal(codigoProvincia('Illes Balears'), '07');
  assert.equal(codigoProvincia('València/Valencia'), '46');
  assert.equal(codigoProvincia('Castelló/Castellón'), '12');
});

test('un nombre desconocido no se adivina', () => {
  assert.equal(codigoProvincia('Provincia Inventada'), null);
  assert.equal(codigoProvincia(''), null);
  assert.equal(codigoProvincia(null), null);
});

test('cada provincia pertenece a su comunidad', () => {
  assert.equal(codigoCCAA('50'), '02'); // Zaragoza -> Aragón
  assert.equal(codigoCCAA('35'), '05'); // Las Palmas -> Canarias
  assert.equal(codigoCCAA('51'), '18'); // Ceuta
});

test('normalizar quita tildes y puntuación', () => {
  assert.equal(normalizar('Málaga'), 'malaga');
  assert.equal(normalizar('  Araba/Álava '), 'araba alava');
});

test('las grafías del fichero del Ministerio cruzan con el código INE', () => {
  // Tal como vienen en la columna PROVINCIA: mayúsculas, sin tildes, abreviadas.
  assert.equal(codigoProvincia('I. BALEARS'), '07');
  assert.equal(codigoProvincia('S.C.TENERIFE'), '38');
  assert.equal(codigoProvincia('LAS PALMAS'), '35');
  assert.equal(codigoProvincia('A CORUÑA'), '15');
  assert.equal(codigoProvincia('ALAVA'), '01');
  assert.equal(codigoProvincia('BIZKAIA'), '48');
  assert.equal(codigoProvincia('GIPUZKOA'), '20');
  assert.equal(codigoProvincia('CASTELLON'), '12');
  assert.equal(codigoProvincia('LA RIOJA'), '26');
  assert.equal(codigoProvincia('ASTURIAS'), '33');
  assert.equal(codigoProvincia('CEUTA'), '51');
  assert.equal(codigoProvincia('MELILLA'), '52');
});

test('la razón social pierde el relleno, nada más', () => {
  assert.equal(limpiarRazonSocial('  JUAN MANUEL BAILEN ANGUITA, SL'), 'JUAN MANUEL BAILEN ANGUITA, SL');
  assert.equal(limpiarRazonSocial(' TRANSPORTES Y DESGUACES FAUSTO, SL '), 'TRANSPORTES Y DESGUACES FAUSTO, SL');
  assert.equal(limpiarRazonSocial('DELGO  OPERADOR SL'), 'DELGO OPERADOR SL');
  // La puntuación es del registro y se queda: no se "normalizan" las formas societarias.
  assert.equal(limpiarRazonSocial('100 POR 100 EXPRESS, SL.'), '100 POR 100 EXPRESS, SL.');
  assert.equal(limpiarRazonSocial(null), '');
});

test('el artículo pospuesto del municipio vuelve a su sitio', () => {
  assert.equal(normalizarMunicipio('EJIDO (EL)'), 'EL EJIDO');
  assert.equal(normalizarMunicipio('VALADOURO (O)'), 'O VALADOURO');
  assert.equal(normalizarMunicipio('POBLA (SA)'), 'SA POBLA');
  assert.equal(normalizarMunicipio('SALINES (SES)'), 'SES SALINES');
  assert.equal(normalizarMunicipio('PALMAS DE GRAN CANARIA (LAS)'), 'LAS PALMAS DE GRAN CANARIA');
  // El apóstrofo va pegado al nombre.
  assert.equal(normalizarMunicipio("ALCORA (L')"), "L'ALCORA");
});

test('los municipios sin artículo pospuesto no se tocan', () => {
  assert.equal(normalizarMunicipio('MADRID'), 'MADRID');
  assert.equal(normalizarMunicipio('ALICANTE/ALACANT'), 'ALICANTE/ALACANT');
  assert.equal(normalizarMunicipio('VITORIA-GASTEIZ'), 'VITORIA-GASTEIZ');
  // Un paréntesis que no es un artículo se queda donde está.
  assert.equal(
    normalizarMunicipio('NOAIN (VALLE DE ELORZ)/NOAIN (ELORTZIBAR)'),
    'NOAIN (VALLE DE ELORZ)/NOAIN (ELORTZIBAR)',
  );
  // Una errata de origen no se adivina: "(L)" no es "(L')".
  assert.equal(normalizarMunicipio('ALDEA (L)'), 'ALDEA (L)');
  assert.equal(normalizarMunicipio(''), null);
  assert.equal(normalizarMunicipio(null), null);
});

test('en los bilingües el artículo se recoloca en cada mitad', () => {
  assert.equal(normalizarMunicipio('ALQUERIAS DEL NIÑO PERDIDO/ALQUERIES (LES)'), 'ALQUERIAS DEL NIÑO PERDIDO/LES ALQUERIES');
  assert.equal(normalizarMunicipio("ALCUDIA (L')/ALCUDIA (LA)"), "L'ALCUDIA/LA ALCUDIA");
});

test('solo pasa un código postal de verdad; el resto queda sin CP', () => {
  assert.equal(normalizarCP('23650'), '23650');
  assert.equal(normalizarCP('07712'), '07712');
  assert.equal(normalizarCP(' 46190 '), '46190');
  assert.equal(normalizarCP('2770'), null); // truncado: no se rellena con un cero
  assert.equal(normalizarCP('00000'), null);
  assert.equal(normalizarCP('62000'), null); // no existe la provincia 62
  assert.equal(normalizarCP(' '), null);
  assert.equal(normalizarCP(null), null);
});

test('convierte el serial de Excel a AAAA-MM-DD sin depender de la zona horaria', () => {
  assert.equal(fechaDesdeSerial(45826), '2025-06-18');
  assert.equal(fechaDesdeSerial(39804), '2008-12-22');
  // Una fracción de día no salta al siguiente.
  assert.equal(fechaDesdeSerial(45826.75), '2025-06-18');
  assert.equal(fechaDesdeSerial('2025-06-18'), null);
  assert.equal(fechaDesdeSerial(null), null);
  assert.equal(fechaDesdeSerial(1), null);
});

test('los vehículos son un entero o no son nada', () => {
  assert.equal(parseVehiculos(14), 14);
  assert.equal(parseVehiculos(0), 0);
  assert.equal(parseVehiculos(2.5), null);
  assert.equal(parseVehiculos(-1), null);
  assert.equal(parseVehiculos('14'), null);
  assert.equal(parseVehiculos(null), null);
});
