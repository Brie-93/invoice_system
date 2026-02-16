"use client";

import React, { useState } from 'react';
import { X, Plus, Trash2, Send, Save, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([{ id: 1, description: '', quantity: 1, price: 0 }]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l border-border/40 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-background/80 backdrop-blur-md p-6 border-b border-border/40 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                   <CreditCard className="w-4 h-4 text-white" />
                </div>
                Create New Invoice
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Client Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Corp" 
                    className="w-full px-4 py-3 bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Client Email</label>
                  <input 
                    type="email" 
                    placeholder="billing@acme.com" 
                    className="w-full px-4 py-3 bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Invoice Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Line Items</label>
                  <button 
                    onClick={addItem}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-6">
                        <input 
                          type="text" 
                          placeholder="Item description" 
                          className="w-full px-3 py-2 bg-muted/20 border border-border/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          placeholder="Qty" 
                          className="w-full px-3 py-2 bg-muted/20 border border-border/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          defaultValue={1}
                        />
                      </div>
                      <div className="col-span-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                          <input 
                            type="number" 
                            placeholder="Price" 
                            className="w-full pl-6 pr-3 py-2 bg-muted/20 border border-border/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-border/40 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-semibold">${(calculateTotal() * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold pt-2 border-t border-border/10">
                  <span>Total Amount</span>
                  <span className="text-indigo-500">${(calculateTotal() * 1.1).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-muted hover:bg-muted/80 rounded-xl font-bold transition-all">
                  <Save className="w-5 h-5" />
                  Save Draft
                </button>
                <button 
                  onClick={onClose}
                  className="flex-2 flex items-center justify-center gap-2 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  <Send className="w-5 h-5" />
                  Send Invoice
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
