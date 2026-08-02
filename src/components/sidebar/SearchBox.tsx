import { useId } from 'react';

interface Props {
  consulta: string;
  onCambiar: (consulta: string) => void;
}

/**
 * Buscador del listado. `type="search"` para que el navegador ofrezca el
 * borrado nativo donde exista, más una cruz propia y Escape para vaciarlo sin
 * soltar el teclado.
 */
export function SearchBox({ consulta, onCambiar }: Props) {
  const id = useId();

  return (
    <div className="relative shrink-0 border-b border-asfalto/40">
      <label htmlFor={id} className="sr-only">
        Buscar empresa por nombre, NIF o localidad
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
        placeholder="Buscar por nombre, NIF o localidad…"
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
