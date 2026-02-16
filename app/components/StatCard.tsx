import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, icon: Icon, color }) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-500 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/20',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-500 border-rose-500/20',
  };

  const trendPositive = trend >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`p-6 rounded-2xl bg-linear-to-br ${colorMap[color]} border backdrop-blur-sm shadow-xl transition-all duration-300`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl bg-background/50 border border-current/10 shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
          {trendPositive ? '+' : ''}{trend}%
        </div>
      </div>
      <div>
        <h3 className="text-muted-foreground text-sm font-medium mb-1">{label}</h3>
        <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
      </div>
    </motion.div>
  );
};
