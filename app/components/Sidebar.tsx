import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'invoices', icon: FileText, label: 'Invoices' },
    { id: 'clients', icon: Users, label: 'Clients' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-screen w-64 bg-background border-r border-border/40 flex flex-col p-6 sticky top-0">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Zap className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
          NEON.FLOW
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group ${
              activeTab === item.id 
                ? 'text-indigo-500 bg-indigo-500/5' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="font-medium">{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="active-pill"
                className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-border/40">
        <div className="p-4 rounded-2xl bg-linear-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Pro Plan</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Unlock unlimited invoices and smart analytics.</p>
          <button className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm transition-colors shadow-lg shadow-indigo-500/20">
            Upgrade Now
          </button>
        </div>
        
        <button className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive transition-colors rounded-xl hover:bg-destructive/5">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
