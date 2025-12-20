import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/shared/lib/utils"

const Tabs = TabsPrimitive.Root

/**
 * @typedef {import("@radix-ui/react-tabs").TabsListProps & { children: React.ReactNode }} TabsListProps
 */

/**
 * @type {React.ForwardRefExoticComponent<TabsListProps & React.RefAttributes<HTMLDivElement>>}
 */
const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * @typedef {import("@radix-ui/react-tabs").TabsTriggerProps & { children: React.ReactNode }} TabsTriggerProps
 */

/**
 * @type {React.ForwardRefExoticComponent<TabsTriggerProps & React.RefAttributes<HTMLButtonElement>>}
 */
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * @typedef {import("@radix-ui/react-tabs").TabsContentProps & { children: React.ReactNode }} TabsContentProps
 */

/**
 * @type {React.ForwardRefExoticComponent<TabsContentProps & React.RefAttributes<HTMLDivElement>>}
 */
const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
