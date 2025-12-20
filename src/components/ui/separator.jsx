import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/shared/lib/utils"

/**
 * @typedef {Object} SeparatorProps
 * @property {string} [className]
 * @property {"horizontal" | "vertical"} [orientation]
 * @property {boolean} [decorative]
 */

/**
 * @type {React.ForwardRefExoticComponent<SeparatorProps & React.RefAttributes<HTMLDivElement>>}
 */
const Separator = React.forwardRef((
  { className, orientation = "horizontal", decorative = true, ...props },
  ref
) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props} />
))
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
