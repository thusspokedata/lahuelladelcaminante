import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"

interface ImagePlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: "square" | "video" | "wide" | number
}

export function ImagePlaceholder({
  aspectRatio = "square",
  className,
  ...props
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md border bg-muted",
        {
          "aspect-square": aspectRatio === "square",
          "aspect-video": aspectRatio === "video",
          "aspect-[16/9]": aspectRatio === "wide",
        },
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <ImageIcon className="h-8 w-8" />
        <p className="text-sm">Imagen no provista</p>
      </div>
    </div>
  )
} 