"use client"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = ({ className, value = 0, max = 100, ...props }: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  return (
    <div
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-gray-200", className)}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-purple-600 transition-all duration-300"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
}

export { Progress }