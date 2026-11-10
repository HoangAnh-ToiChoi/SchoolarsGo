import { cva } from "class-variance-authority";

import { cn } from "~/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // ScholarsGo: nhãn mang nghĩa (hạn nộp, phạm vi)
        neutral: "h-6 gap-1.5 rounded-[6px] border-line bg-hover px-2 text-fg-secondary",
        urgent: "h-6 gap-1.5 rounded-[6px] border-urgent-line bg-urgent-bg px-2 text-urgent-fg",
        soon: "h-6 gap-1.5 rounded-[6px] border-soon-line bg-soon-bg px-2 text-soon-fg",
        open: "h-6 gap-1.5 rounded-[6px] border-open-line bg-open-bg px-2 text-open-fg",
        abroad: "h-6 gap-1.5 rounded-[6px] border-abroad-line bg-abroad-bg px-2 text-abroad-fg",
        domestic: "h-6 gap-1.5 rounded-[6px] border-domestic-line bg-domestic-bg px-2 text-domestic-fg",
        brand: "h-6 gap-1.5 rounded-[6px] border-brand-200 bg-brand-50 px-2 text-brand-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
