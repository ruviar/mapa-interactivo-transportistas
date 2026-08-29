import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Al cambiar, si había un fallo, lo da por superado (p. ej. al navegar por el desglose). */
  resetKey: string;
  onReintentar: () => void;
}

interface State {
  fallo: boolean;
}

/**
 * Red de seguridad alrededor del mapa. Leaflet no vive dentro del ciclo de
 * render de React: un cálculo de encuadre que le llegue mal (ver el guarda en
 * `Encuadre`, en `SpainMap.tsx`) puede lanzar durante una animación, fuera de
 * un evento normal, y sin un boundary aquí React desmonta TODA la
 * herramienta —cabecera y panel incluidos— a una pantalla en blanco por un
 * fallo de una sola pieza. Con esto el fallo se queda contenido: el resto
 * sigue vivo y hay cómo reintentar.
 */
export class MapErrorBoundary extends Component<Props, State> {
  state: State = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('El mapa ha fallado:', error);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.fallo && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ fallo: false });
    }
  }

  render() {
    if (!this.state.fallo) return this.props.children;

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-mar/15 px-6 text-center">
        <p className="max-w-xs text-body-sm text-ink">
          El mapa ha tenido un problema al encuadrar la vista.
        </p>
        <button
          type="button"
          onClick={() => {
            this.setState({ fallo: false });
            this.props.onReintentar();
          }}
          className="border border-asfalto/50 px-4 py-2 text-body-sm font-medium uppercase tracking-wide text-ink transition-colors duration-150 hover:border-atencion hover:text-atencion"
        >
          Volver al mapa nacional
        </button>
      </div>
    );
  }
}
