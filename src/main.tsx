import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/theme.css';
import App from './App';
import { Fase6Lab } from './lab/Fase6Lab';
import { Fase7aLab } from './lab/Fase7aLab';

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Falta #root en index.html');

const parametros = new URLSearchParams(window.location.search);
/** Banco de pruebas de la Fase 6: temporal, se va al cerrar la fase. */
const banco = parametros.has('lab');
/** Spike técnico de la Fase 7a: temporal, se va al cerrar el spike. */
const tierra = parametros.has('tierra');

createRoot(raiz).render(
  <StrictMode>{tierra ? <Fase7aLab /> : banco ? <Fase6Lab /> : <App />}</StrictMode>,
);
