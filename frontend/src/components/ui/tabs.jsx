import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "~/utils/cn"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-control items-center justify-center rounded-inner bg-track p-1 text-fg-secondary",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

// Radix tự focus tab khi bấm chuột nên viền focus hiện cả lúc bấm chuột; tab đang chọn đã nổi bật (nền trắng)
// nên khi focus chỉ đổi màu chữ sang tím để vẫn thấy được bằng bàn phím.
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex h-full items-center justify-center whitespace-nowrap rounded-[7px] px-4 text-[13px] font-medium transition-colors duration-150 hover:text-fg focus-visible:outline-none focus-visible:text-brand-600 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-surface data-[state=active]:font-semibold data-[state=active]:text-fg data-[state=active]:shadow-tile",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 rounded-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
