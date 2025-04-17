import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

interface ImagePlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: "square" | "video" | "wide" | number;
}

export function ImagePlaceholder({
  aspectRatio = "square",
  className,
  ...props
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "bg-muted flex items-center justify-center rounded-md border",
        {
          "aspect-square": aspectRatio === "square",
          "aspect-video": aspectRatio === "video",
          "aspect-[16/9]": aspectRatio === "wide",
        },
        className
      )}
      {...props}
    >
      <div className="text-muted-foreground flex flex-col items-center gap-2">
        <ImageIcon className="h-8 w-8" />
        <p className="text-sm">Imagen no provista</p>
      </div>
    </div>
  );
}
