"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

interface AnimatedChartProps {
  data: any[];
  type?: "line" | "bar";
  dataKey: string;
  xAxisKey?: string;
  delay?: number;
  unit?: string;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl border border-slate-800/60 shadow-xl bg-[#0F172A] text-white min-w-[120px]">
        <p className="text-xs text-slate-400 font-semibold mb-1">{label}</p>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <p className="text-sm text-white font-bold">
            {payload[0].value}{unit || ""}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function AnimatedChart({ data, type = "line", dataKey, xAxisKey = "name", delay = 0, unit }: AnimatedChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="glass w-full p-6 rounded-2xl h-[300px] flex items-center justify-center">
        <div className="animate-pulse text-xs text-foreground/40 font-medium">Loading analysis chart...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="glass w-full p-6 rounded-2xl h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        {type === "line" ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#94A3B8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              interval={0}
              tickFormatter={(value) => value && value.length > 15 ? `${value.slice(0, 12)}...` : value}
            />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: "rgba(16,185,129,0.2)", strokeWidth: 2 }} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981"/>
                <stop offset="100%" stopColor="#059669"/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#94A3B8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              interval={0}
              tickFormatter={(value) => value && value.length > 15 ? `${value.slice(0, 12)}...` : value}
            />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: "rgba(16,185,129,0.08)" }} />
            <Bar dataKey={dataKey} fill="url(#colorBar)" radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  );
}
