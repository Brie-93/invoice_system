// app/components/Settings.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Moon, Sun, Lock, Loader2, Palette } from 'lucide-react';
import { toast } from 'sonner';
export const Settings = () => {
const[isDarkMode, setIsDarkMode] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
// Load theme on mount
useEffect(() => {
const isDark = document.documentElement.classList.contains('dark');
setIsDarkMode(isDark);
},[]);

// Sync theme with local storage on initial load to prevent flicker
useEffect(() => {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    setIsDarkMode(true);
  } else {
    document.documentElement.classList.remove('dark');
    setIsDarkMode(false);
  }
},[]);

const toggleTheme = () => {
  const newTheme = !isDarkMode;
  setIsDarkMode(newTheme);
  if (newTheme) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark'); // Force body as well
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Updating password...");
    
    try {
      // 1. Get the auth token from storage
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      // 2. Send the request to our new backend endpoint
      const response = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Proves who is making the request
        },
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      // 3. Success!
      toast.success("Password updated successfully!", { id: toastId });
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' }); // Clear form
      
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

return (
  <div className="max-w-4xl mx-auto space-y-8 pb-12">
    <div>
      <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
      <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your preferences and security.</p>
    </div>

    {/* APPEARANCE SECTION */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#030213] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Palette className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes.</p>
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
      className="bg-white dark:bg-[#030213] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
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