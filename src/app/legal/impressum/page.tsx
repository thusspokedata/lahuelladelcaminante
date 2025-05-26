import Link from "next/link";

export const metadata = {
  title: "Impressum | La Huella del Caminante",
  description: "Información legal sobre La Huella del Caminante",
};

export default function ImpressumPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Impressum</h1>

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-xl font-semibold">Información de acuerdo con § 5 TMG</h2>
          <p>La Huella del Caminante</p>
          <p>Antonio Saleme</p>
          <p>Uferstr. 19</p>
          <p>13357, Berlín</p>
          <p>Alemania</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Contacto</h2>
          <p>Email: info@lahuelladelcaminante.de</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Responsabilidad por el contenido</h2>
          <p>
            Como proveedores de servicios, somos responsables de nuestro propio contenido en estas
            páginas de acuerdo con § 7, párrafo 1 de la Ley Alemana de Telemedia (TMG). Sin embargo,
            de acuerdo con §§ 8 a 10 TMG, no estamos obligados a monitorear la información
            transmitida o almacenada de terceros, ni a investigar circunstancias que indiquen
            actividad ilegal.
          </p>
          <p>
            Las obligaciones de eliminar o bloquear el uso de información según las leyes generales
            permanecen sin ser afectadas. Sin embargo, la responsabilidad a este respecto sólo es
            posible a partir del momento en que tengamos conocimiento de una infracción concreta. Al
            tener conocimiento de tales infracciones, eliminaremos dicho contenido inmediatamente.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Enlaces a sitios web de terceros</h2>
          <p>
            Nuestro sitio contiene enlaces a sitios web externos de terceros sobre los cuales no
            tenemos control. Por lo tanto, no podemos aceptar ninguna responsabilidad por su
            contenido. El respectivo proveedor o operador de las páginas es siempre responsable por
            el contenido de los sitios enlazados. Los sitios enlazados fueron verificados por
            posible contenido ilegal en el momento del enlace. No se identificó ningún contenido
            ilegal en el momento en que se estableció el enlace.
          </p>
          <p>
            Un monitoreo permanente del contenido de los sitios enlazados no es razonable sin
            evidencia concreta de una violación. Al tener conocimiento de infracciones, eliminaremos
            dichos enlaces inmediatamente.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Derechos de autor</h2>
          <p>
            El contenido y las obras creadas por los operadores del sitio están sujetos a la ley
            alemana de derechos de autor. La duplicación, el procesamiento, la distribución y
            cualquier tipo de explotación fuera de los límites de la ley de derechos de autor
            requieren el consentimiento por escrito del respectivo autor o creador.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          ← Volver a la página principal
        </Link>
      </div>
    </div>
  );
}
