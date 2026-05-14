"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
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
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 rounded-xl border border-white/20 shadow-xl bg-black/80 text-white min-w-[120px]">
        <p className="text-sm font-bold text-foreground mb-1">{label}</p>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <p className="text-sm text-foreground/80 font-medium">
            <span className="text-primary font-bold">{payload[0].value}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function AnimatedChart({ data, type = "line", dataKey, xAxisKey = "name", delay = 0 }: AnimatedChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="glass w-full p-6 rounded-2xl h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        {type === "line" ? (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(153,27,27,0.2)", strokeWidth: 2 }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#991b1b"
              strokeWidth={3}
              dot={{ r: 4, fill: "#991b1b", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, fill: "#991b1b" }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(153,27,27,0.1)" }} />
            <Bar dataKey={dataKey} fill="#991b1b" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  );
}
