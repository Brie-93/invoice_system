// app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { InvoiceList } from '../components/InvoiceList';
import { ClientList } from '../components/ClientList';
import { Toaster, toast } from 'sonner';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react'; // or framer-motion

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- SECURITY CHECK ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token exists, kick them back to login
      router.push('/login');
    } else {
      // If token exists, allow them to see the page
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  // Show a blank screen or loading spinner while checking auth
  if (!isAuthenticated) return null; 

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
      {/* SIDEBAR */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAV (Optional: You can move this to a separate component later) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-96">
            <Search className="h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search invoices, clients, projects..." 
              className="bg-transparent border-none outline-none ml-2 w-full text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 bg-black rounded-full flex items-center justify-center text-white">
              <User className="h-4 w-4" />
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 flex items-center font-medium"
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </button>
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
              {activeTab === 'invoices' && <InvoiceList />}
              {activeTab === 'clients' && <ClientList />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}