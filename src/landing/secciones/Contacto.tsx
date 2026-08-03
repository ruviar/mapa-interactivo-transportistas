import { Accion } from '../piezas/Accion';
import { Revelar } from '../piezas/Revelar';

/**
 * Contacto. Sin datos de empresa inventados —no hay marca ni razón social en
 * el brief— así que el correo va sobre `ejemplo.com`, el dominio reservado
 * para placeholders (RFC 2606): en cuanto haya un remitente real, es la única
 * cadena que hay que cambiar.
 */
const CORREO_PLACEHOLDER = 'contacto@ejemplo.com';

export function Contacto() {
  return (
    <section id="contacto" className="bg-base px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 border-t border-asfalto/25 pt-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Revelar>
          <div className="max-w-2xl">
            <p className="font-mono text-caption uppercase tracking-[0.2em] text-asfalto">
              Contacto
            </p>
            <h2 className="rotulo-landing mt-3 text-titular text-ink">
              ¿Buscas algo que el mapa no resuelve?
            </h2>
            <p className="mt-4 text-body text-ink/70">
              Si el filtro por plantilla se te queda corto, necesitas los datos en otro formato o
              quieres hablar del umbral de flota antes de decidirte, escríbenos directamente.
            </p>
            <div className="mt-8">
              <Accion href={`mailto:${CORREO_PLACEHOLDER}`}>Escribir un correo</Accion>
            </div>
          </div>
        </Revelar>

        {/* Placeholder de imagen (nave logística, ver brief) — sin foto real
            generada esta sesión. Gradiente navy→ámbar sobre el mismo mar de
            carta náutica del mapa, para que el hueco no desentone mientras no
            haya una fotografía que ponerle. Bloque puramente decorativo. */}
        <Revelar retardo={0.1} className="hidden aspect-[4/3] overflow-hidden rounded-xl lg:block">
          <div
            aria-hidden="true"
            className="h-full w-full"
            style={{
              background:
                'radial-gradient(120% 100% at 20% 0%, var(--color-mar) 0%, var(--color-navy-800) 55%, var(--color-navy-950) 100%)',
            }}
          />
        </Revelar>
      </div>
    </section>
  );
}
