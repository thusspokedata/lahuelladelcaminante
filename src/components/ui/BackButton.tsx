"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  label: string
}

export function BackButton({ label }: BackButtonProps) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      onClick={() => router.back()}
      className="mb-4 text-muted-foreground hover:text-foreground rounded-full -ml-2"
    >
      <ArrowLeft className="w-4 h-4 mr-1.5" />
      {label}
    </Button>
  )
}
