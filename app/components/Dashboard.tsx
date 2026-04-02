// app/components/Dashboard.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Banknote, Users, Clock, ArrowUpRight, Archive } from "lucide-react";
import { motion } from "motion/react";
import { formatKsh } from "../lib/currency";
import { RecordsHistoryModal } from "./RecordsHistoryModal";

type ChartRow = { name: string; revenue: number; billed: number };

export const Dashboard = () => {
  const [stats, setStats] = useState<{
    totalRevenue: number;
    outstanding: number;
    clientCount: number;
    chartData: ChartRow[];
  } | null>(null);
  const [recordsOpen, setRecordsOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("https://invoice-system-backend-au29.onrender.com/api/app/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    };
    fetchStats();
  }, []);

  if (!stats) {
    return (
      <div className="p-8 text-gray-500 animate-pulse">Loading schematics...</div>
    );
  }

  const cards = [
    {
      title: "Total revenue",
      value: formatKsh(stats.totalRevenue),
      icon: Banknote,
      trend: "+12.5%",
    },
    {
      title: "Outstanding",
      value: formatKsh(stats.outstanding),
      icon: Clock,
      trend: "-2.4%",
    },
    { title: "Active clients", value: String(stats.clientCount), icon: Users, trend: "+4" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Studio Overview</h1>
          <p className="mt-1 text-gray-500">
            Welcome back. Here is what is happening with your projects today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRecordsOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
        >
          <Archive className="h-4 w-4 text-indigo-600" />
          Records &amp; history
        </button>
      </div>

      <RecordsHistoryModal isOpen={recordsOpen} onClose={() => setRecordsOpen(false)} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="absolute right-0 top-0 p-6 opacity-5 transition-opacity group-hover:opacity-10">
              <card.icon size={64} />
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <h3 className="mt-2 text-3xl font-bold text-gray-900">{card.value}</h3>
              </div>
              <div className="flex items-center rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                {card.trend} <ArrowUpRight size={14} className="ml-1" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-2 font-serif text-lg font-bold text-gray-900">
          Revenue vs invoiced (last 12 months, Ksh)
        </h3>
        <p className="mb-6 text-sm text-gray-500">
          Collected (paid &amp; overpaid) vs total invoiced in each month by issue date.
        </p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stats.chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v) =>
                  typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) =>
                  typeof value === "number" ? formatKsh(value) : String(value ?? "")
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Collected"
                stroke="#4f46e5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
              <Area
                type="monotone"
                dataKey="billed"
                name="Invoiced"
                stroke="#0d9488"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBilled)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};
