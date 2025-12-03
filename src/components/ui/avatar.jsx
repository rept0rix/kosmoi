"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * @typedef {Object} AvatarProps
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @type {React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLSpanElement>>}
 */
const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props} />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

/**
 * @typedef {Object} AvatarImageProps
 * @property {string} [className]
 * @property {string} [src]
 * @property {string} [alt]
 */

/**
 * @type {React.ForwardRefExoticComponent<AvatarImageProps & React.RefAttributes<HTMLImageElement>>}
 */
const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props} />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

/**
 * @typedef {Object} AvatarFallbackProps
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @type {React.ForwardRefExoticComponent<AvatarFallbackProps & React.RefAttributes<HTMLSpanElement>>}
 */
const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props} />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
