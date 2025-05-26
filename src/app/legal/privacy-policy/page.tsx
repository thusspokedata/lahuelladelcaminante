import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | La Huella del Caminante",
  description: "Información sobre cómo tratamos tus datos personales",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Política de Privacidad</h1>

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-xl font-semibold">1. Información general</h2>
          <p>
            Esta Política de Privacidad proporciona información sobre cómo tratamos tus datos
            personales al usar nuestro sitio web. Tu privacidad es importante para nosotros y nos
            comprometemos a ser transparentes sobre los datos que recopilamos.
          </p>
          <p>
            La entidad responsable del procesamiento de datos según el Art. 4 (7) del Reglamento
            General de Protección de Datos de la UE (GDPR) es:
          </p>
          <p className="mt-2">
            La Huella del Caminante
            <br />
            Antonio Saleme
            <br />
            Uferstr. 19
            <br />
            13357, Berlín
            <br />
            Alemania
            <br />
            Email: info@lahuelladelcaminante.de
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">2. Datos que recopilamos</h2>
          <p>
            Actualmente, solo recopilamos la información básica necesaria para la gestión de cuentas
            de usuario a través de nuestro proveedor de autenticación, Clerk:
          </p>
          <ul className="mt-2 list-disc pl-6">
            <li>Dirección de email</li>
            <li>Nombre de usuario</li>
          </ul>
          <p className="mt-2">
            No utilizamos cookies para el seguimiento de comportamiento ni recopilamos información
            adicional sobre nuestros usuarios en este momento.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">3. Finalidad del procesamiento de datos</h2>
          <p>Procesamos los datos de email y nombre de usuario únicamente para:</p>
          <ul className="mt-2 list-disc pl-6">
            <li>Crear y gestionar tu cuenta de usuario</li>
            <li>Proporcionar acceso a funciones reservadas para usuarios registrados</li>
            <li>Comunicarnos contigo en caso necesario sobre el funcionamiento del servicio</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">4. Base legal para el procesamiento</h2>
          <p>Procesamos tus datos personales según el Art. 6 (1) del GDPR en base a:</p>
          <ul className="mt-2 list-disc pl-6">
            <li>
              Tu consentimiento (Art. 6 (1) (a) GDPR): Al registrarte, das tu consentimiento para el
              procesamiento de tu email y nombre de usuario.
            </li>
            <li>
              Ejecución de un contrato (Art. 6 (1) (b) GDPR): El procesamiento es necesario para
              proporcionarte acceso a nuestra plataforma.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">5. Proveedores de servicios</h2>
          <p>
            Utilizamos Clerk (clerk.dev) como nuestro proveedor de autenticación. Clerk procesa los
            datos de autenticación en nuestro nombre y cumple con las regulaciones de protección de
            datos del GDPR. Puedes consultar la política de privacidad de Clerk en su sitio web.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">6. Tus derechos</h2>
          <p>Como sujeto de datos, tienes los siguientes derechos según el GDPR:</p>
          <ul className="mt-2 list-disc pl-6">
            <li>Derecho de acceso a tus datos personales</li>
            <li>Derecho a rectificar datos incorrectos</li>
            <li>Derecho a eliminar tus datos (derecho al olvido)</li>
            <li>Derecho a limitar el procesamiento de tus datos</li>
            <li>Derecho a la portabilidad de tus datos</li>
            <li>Derecho a retirar tu consentimiento en cualquier momento</li>
          </ul>
          <p className="mt-2">
            Para ejercer estos derechos, por favor contacta con nosotros en la dirección de email
            proporcionada anteriormente.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">7. Cambios a esta política</h2>
          <p>
            Podemos actualizar nuestra Política de Privacidad cuando implementemos nuevas
            funcionalidades que impliquen el procesamiento de datos personales adicionales.
            Publicaremos cualquier cambio en esta página.
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
