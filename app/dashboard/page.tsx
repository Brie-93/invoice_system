// app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { InvoiceList } from '../components/InvoiceList';
import { ClientList } from '../components/ClientList';
import { Settings } from '../components/Settings';
import { InvoiceForm, type PrefilledClient } from '../components/InvoiceForm';
import { Toaster, toast } from 'sonner';
import { Bell, Search, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserData {
  name: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const[dataVersion, setDataVersion] = useState(0);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [invoicePrefill, setInvoicePrefill] = useState<PrefilledClient | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);

  // New States for User Header
  const [user, setUser] = useState<UserData | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const bumpData = () => setDataVersion((n) => n + 1);

  const openInvoiceForm = (client: PrefilledClient | null, invoiceId: number | null = null) => {
    setInvoicePrefill(client);
    setEditingInvoiceId(invoiceId);
    setInvoiceFormOpen(true);
  };

  const closeInvoiceForm = () => {
    setInvoiceFormOpen(false);
    setInvoicePrefill(null);
    setEditingInvoiceId(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      // Decode JWT token to get user info without an extra API call
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ name: payload.name || 'Designer', email: payload.email });
      } catch (e) {
        console.error("Could not parse token");
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  if (!isAuthenticated) return null; 

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#030213] overflow-hidden text-gray-900 dark:text-gray-100 transition-colors">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white dark:bg-[#0a0a1a] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 z-10 transition-colors">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800/50 rounded-xl px-3 py-2 w-96 border border-transparent dark:border-gray-700/50">
            <Search className="h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="bg-transparent border-none outline-none ml-2 w-full text-sm dark:text-white placeholder:text-gray-400"
            />
          </div>
          
          <div className="flex items-center space-x-5">
            <button className="text-gray-400 hover:text-indigo-500 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            </button>
            
            {/* CLICKABLE AVATAR DROPDOWN */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 dark:hover:ring-offset-gray-900 transition-all cursor-pointer"
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Hello, {user?.name.split(' ')[0]}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('settings'); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Account Settings
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'invoices' && (
                <InvoiceList
                  refreshKey={dataVersion}
                  onCreateInvoice={() => openInvoiceForm(null)}
                  onEditDraft={(id) => openInvoiceForm(null, id)}
                  onDataChanged={bumpData}
                />
              )}
              {activeTab === 'clients' && (
                <ClientList
                  refreshKey={dataVersion}
                  onDataChanged={bumpData}
                  onCreateInvoiceForClient={(c) => {
                    setActiveTab('invoices');
                    openInvoiceForm(c);
                  }}
                />
              )}
              {activeTab === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <InvoiceForm
        isOpen={invoiceFormOpen}
        onClose={closeInvoiceForm}
        prefilledClient={invoicePrefill}
        editingInvoiceId={editingInvoiceId}
        onSuccess={bumpData}
      />

      <Toaster position="bottom-right" />
    </div>
  );
}