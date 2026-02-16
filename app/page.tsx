"use client"; 

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { Toaster, toast } from 'sonner';
import { Bell, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onCreateInvoice={() => setIsInvoiceFormOpen(true)} />;
      case 'invoices':
        return <InvoiceList />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
               <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">Under Construction</h2>
            <p className="text-muted-foreground mt-2">This module is being built with cosmic energy.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-indigo-500/30">
      <Toaster position="top-right" theme="dark" />
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-border/40 px-8 flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4 bg-muted/30 border border-border/40 px-4 py-2 rounded-xl w-96 group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Quick search... (⌘K)" 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 hover:bg-muted rounded-xl transition-colors group">
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-background" />
            </button>
            <div className="h-8 w-[1px] bg-border/40" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">Alex Rivera</p>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-tighter">Finance Lead</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100" 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="min-w-0"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <InvoiceForm 
        isOpen={isInvoiceFormOpen} 
        onClose={() => {
          setIsInvoiceFormOpen(false);
          if (Math.random() > 0.5) toast.success('Invoice saved as draft!');
        }} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: oklch(0.269 0 0);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: oklch(0.439 0 0);
        }
      `}} />
    </div>
  );
};

export default App;
