import { Search, X } from 'lucide-react';
import { useId } from 'react';

interface Props {
  consulta: string;
  onCambiar: (consulta: string) => void;
  /** Texto del placeholder; por defecto el del buscador de provincia. */
  placeholder?: string;
  /** Etiqueta accesible; por defecto la del buscador de provincia. */
  etiqueta?: string;
}

/**
 * Buscador del listado. Antes era una línea de texto con un simple borde
 * inferior — se leía como un dato más del panel, no como el control principal
 * que es. El icono de lupa y la caja con borde propio lo sacan de esa fila:
 * es lo primero que se ve al entrar en cualquier listado.
 *
 * `type="search"` para que el navegador ofrezca el borrado nativo donde
 * exista, más una cruz propia y Escape para vaciarlo sin soltar el teclado.
 */
export function SearchBox({
  consulta,
  onCambiar,
  placeholder = 'Buscar por nombre, NIF o localidad…',
  etiqueta = 'Buscar empresa por nombre, NIF o localidad',
}: Props) {
  const id = useId();

  return (
    <div className="shrink-0 border-b border-ink/10 px-4 py-2.5">
      <label htmlFor={id} className="sr-only">
        {etiqueta}
      </label>

      {/* Campo de búsqueda de sistema: relleno gris quieto que se vuelve
          superficie blanca con halo del acento al recibir el foco, y la lupa
          se enciende con él. */}
      <div className="group relative flex items-center rounded-lg border border-transparent bg-ink/5 transition-[background-color,border-color,box-shadow] duration-150 focus-within:border-atencion/50 focus-within:bg-superficie focus-within:shadow-[var(--shadow-apoyo)] focus-within:ring-2 focus-within:ring-atencion/20 hover:bg-ink/8">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 size-4 text-asfalto transition-colors duration-150 group-focus-within:text-atencion"
          strokeWidth={1.75}
        />

        <input
          id={id}
          type="search"
          value={consulta}
          onChange={(e) => onCambiar(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && consulta) {
              e.preventDefault();
              onCambiar('');
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent py-2 pl-9 pr-9 text-body-sm placeholder:text-asfalto [&::-webkit-search-cancel-button]:hidden"
        />

        {consulta && (
          <button
            type="button"
            onClick={() => onCambiar('')}
            aria-label="Borrar la búsqueda"
            className="absolute right-2 p-1 text-asfalto transition-colors duration-150 hover:text-ink"
          >
            <X aria-hidden="true" className="size-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
