// @deprecated — dark mode is forced globally since the redesign base PR.
// This component is no longer rendered anywhere in the app. Kept for reference
// until the cleanup PR removes it (and possibly `next-themes` from package.json
// once `components/ui/sonner.tsx` stops importing `useTheme`).
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggle() {
    document.documentElement.classList.toggle("dark")
    setDark(!dark)
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme">
      {dark ? "☀️" : "🌙"}
    </Button>
  )
}
