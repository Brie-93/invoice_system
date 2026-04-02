// app/components/Settings.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Lock, Loader2, Palette, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const[isSaving, setIsSaving] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      // Tailwind v4 uses CSS variables, this ensures text colors flip correctly immediately
      document.documentElement.style.colorScheme = 'dark'; 
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null); // Clear previous errors

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New passwords don't match!");
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Updating password...");
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('https://invoice-system-backend-au29.onrender.com/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // If the backend returns 400 (Incorrect current password), throw that specific message
        throw new Error(data.message || 'Failed to update password');
      }

      toast.success("Password updated successfully!", { id: toastId });
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      
    } catch (error: any) {
      // Catch the specific error and show it in red text below the form
      setPasswordError(error.message);
      toast.error("Failed to update password", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900 dark:text-white transition-colors">Settings</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your preferences and security.</p>
      </div>

      {/* APPEARANCE SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#030213] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm transition-colors"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Palette className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-colors">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Theme</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark mode.</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isDarkMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                isDarkMode ? 'translate-x-8' : 'translate-x-1'
              } flex items-center justify-center`}
            >
              {isDarkMode ? <Moon className="w-3 h-3 text-indigo-600" /> : <Sun className="w-3 h-3 text-gray-400" />}
            </span>
          </button>
        </div>
      </motion.div>

      {/* SECURITY SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#030213] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm transition-colors"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          
          {/* Visual Error Popup inside the form */}
          <AnimatePresence>
            {passwordError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {passwordError}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
            <input
              type="password"
              value={passwords.oldPassword}
              onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="mt-6 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-60 w-full sm:w-auto shadow-md shadow-indigo-500/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Update Password
          </button>
        </form>
      </motion.div>
    </div>
  );
};