import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { DollarSign, Clock, CheckCircle2, AlertCircle, Plus, Search, Filter } from 'lucide-react';
import { StatCard } from './StatCard';
import { motion } from 'motion/react';

const data = [
  { name: 'Jan', revenue: 4000, expenses: 2400 },
  { name: 'Feb', revenue: 3000, expenses: 1398 },
  { name: 'Mar', revenue: 2000, expenses: 9800 },
  { name: 'Apr', revenue: 2780, expenses: 3908 },
  { name: 'May', revenue: 1890, expenses: 4800 },
  { name: 'Jun', revenue: 2390, expenses: 3800 },
  { name: 'Jul', revenue: 3490, expenses: 4300 },
];

const statusData = [
  { name: 'Paid', value: 400, color: '#10b981' },
  { name: 'Pending', value: 300, color: '#f59e0b' },
  { name: 'Overdue', value: 100, color: '#f43f5e' },
];

export const Dashboard: React.FC<{ onCreateInvoice: () => void }> = ({ onCreateInvoice }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <button 
          onClick={onCreateInvoice}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value="$45,231.89" trend={12} icon={DollarSign} color="indigo" />
        <StatCard label="Paid Invoices" value="124" trend={8} icon={CheckCircle2} color="emerald" />
        <StatCard label="Pending" value="$12,305.00" trend={-2} icon={Clock} color="amber" />
        <StatCard label="Overdue" value="12" trend={5} icon={AlertCircle} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/40 shadow-sm min-w-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Revenue Growth</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">Monthly</button>
              <button className="px-3 py-1 text-xs font-medium rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">Yearly</button>
            </div>
          </div>
          <div className="h-[300px] w-full min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888888', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888888', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111111', 
                    border: '1px solid #333', 
                    borderRadius: '12px',
                    fontSize: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm min-w-0">
          <h3 className="font-bold text-lg mb-6">Invoice Status</h3>
          <div className="h-[300px] w-full min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={statusData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#888888', fontSize: 12 }}
                />
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: '#111111', 
                    border: '1px solid #333', 
                    borderRadius: '12px',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
             {statusData.map((s) => (
               <div key={s.name} className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                   <span className="text-sm text-muted-foreground">{s.name}</span>
                 </div>
                 <span className="text-sm font-semibold">{s.value}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Recent Activities</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search activity..." 
                className="pl-9 pr-4 py-2 bg-muted/30 border border-border/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-64"
              />
            </div>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors border border-border/40 text-muted-foreground">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-500 border border-indigo-500/10">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold group-hover:text-indigo-400 transition-colors">Payment received from Acme Corp</h4>
                  <p className="text-xs text-muted-foreground">Invoice #INV-2024-00{i} • 2 hours ago</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-500">+$2,450.00</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
