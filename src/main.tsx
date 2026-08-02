import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/theme.css';
import App from './App';
import { Fase6Lab } from './lab/Fase6Lab';

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Falta #root en index.html');

/** Banco de pruebas de la Fase 6: temporal, se va al cerrar la fase. */
const banco = new URLSearchParams(window.location.search).has('lab');

createRoot(raiz).render(<StrictMode>{banco ? <Fase6Lab /> : <App />}</StrictMode>);
