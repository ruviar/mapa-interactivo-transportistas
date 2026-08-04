import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/theme.css';
import { Fase6Lab } from './lab/Fase6Lab';
import { Raiz } from './Raiz';

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Falta #root en el index.html');

const parametros = new URLSearchParams(window.location.search);
const banco = parametros.get('lab');

function elegir() {
  /** Banco de pruebas de la Fase 6: temporal, se va al cerrar la fase. No participa del toggle landing/app de `Raiz`. */
  if (banco === '6' || banco === '') return <Fase6Lab />;
  // `Raiz` decide landing vs. herramienta (`?app`) leyendo la URL al montar,
  // y a partir de ahí lo lleva como estado en cliente — ver Raiz.tsx.
  return <Raiz />;
}

createRoot(raiz).render(<StrictMode>{elegir()}</StrictMode>);
