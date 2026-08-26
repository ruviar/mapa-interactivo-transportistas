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
 * Buscador del listado. `type="search"` para que el navegador ofrezca el
 * borrado nativo donde exista, más una cruz propia y Escape para vaciarlo sin
 * soltar el teclado. Lo usan el buscador de provincia y el global de España,
 * cada uno con su placeholder y su etiqueta.
 */
export function SearchBox({
  consulta,
  onCambiar,
  placeholder = 'Buscar por nombre, NIF o localidad…',
  etiqueta = 'Buscar empresa por nombre, NIF o localidad',
}: Props) {
  const id = useId();

  return (
    <div className="relative shrink-0 border-b border-asfalto/40">
      <label htmlFor={id} className="sr-only">
        {etiqueta}
      </label>

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
        className="w-full bg-transparent px-4 py-2.5 pr-9 text-body-sm placeholder:text-asfalto focus-visible:outline-offset-[-2px] [&::-webkit-search-cancel-button]:hidden"
      />

      {consulta && (
        <button
          type="button"
          onClick={() => onCambiar('')}
          aria-label="Borrar la búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-body-sm text-asfalto transition-colors duration-150 hover:text-ink"
        >
          ×
        </button>
      )}
    </div>
  );
}
