"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { TooltipProps } from "recharts"

interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

interface ChartContext {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContext | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    return {
      config: {}
    }
  }

  return context
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  className?: string
}

export function CustomTooltip({ active, payload, label, className }: CustomTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className={cn("rounded-lg border bg-background px-3 py-2 text-sm shadow-md", className)}>
      {label && (
        <p className="text-[0.70rem] uppercase text-muted-foreground">{label}</p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span style={{ color: entry.color }}>{entry.name}: </span>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
