'use client'

import React from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export interface ProgressPieDatum {
  name: string
  value: number
  color: string
}

interface ProgressPieProps {
  data: ProgressPieDatum[]
  innerRadius?: number
  outerRadius?: number
  paddingAngle?: number
}

export default function ProgressPie({
  data,
  innerRadius = 50,
  outerRadius = 75,
  paddingAngle = 4,
}: ProgressPieProps) {
  return (
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        paddingAngle={paddingAngle}
        dataKey="value"
      >
        {data.map((entry) => (
          <Cell key={entry.name} fill={entry.color} />
        ))}
      </Pie>
      <ChartTooltip content={<ChartTooltipContent />} />
    </PieChart>
  )
}
