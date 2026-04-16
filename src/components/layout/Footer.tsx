import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-black shadow-sm">
              ♪
            </div>
            <div className="leading-tight">
              <div className="font-black text-sm">La Huella del Caminante</div>
              <div className="text-xs text-muted-foreground">Música Latinoamericana · Berlín</div>
            </div>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/es/events" className="hover:text-foreground transition-colors">Eventos</Link>
            <Link href="/es/artists" className="hover:text-foreground transition-colors">Artistas</Link>
            <Link href="/es/sign-in" className="hover:text-foreground transition-colors">Acceder</Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground text-center">
          © {currentYear} La Huella del Caminante. Hecho con ♥ en Berlín.
        </div>
      </div>
    </footer>
  )
}
