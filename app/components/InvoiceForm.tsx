// app/components/InvoiceForm.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2, Send, Save, CreditCard, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatKsh } from "../lib/currency";

const API_BASE = "http://localhost:3001/api/app";

export type PrefilledClient = {
  id: number;
  name: string;
  email: string;
};

type LineItem = { id: number; description: string; quantity: number; price: number };

type ApiClient = {
  id: number;
  name: string;
  email: string;
};

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledClient?: PrefilledClient | null;
  editingInvoiceId?: number | null;
  onSuccess?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  isOpen,
  onClose,
  prefilledClient = null,
  editingInvoiceId = null,
  onSuccess,
}) => {
  const [items, setItems] = useState<LineItem[]>([
    { id: Date.now(), description: "", quantity: 1, price: 0 },
  ]);
  const[issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [clientList, setClientList] = useState<ApiClient[]>([]);
  const[selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    setItems([{ id: Date.now(), description: "", quantity: 1, price: 0 }]);
    setIssueDate("");
    setDueDate("");
    setSelectedClientId("");

    // Helper to fetch clients
    const loadClients = async () => {
      setLoadingClients(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_BASE}/clients`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() =>[]);
        if (!cancelled && res.ok && Array.isArray(data)) {
          setClientList(data);
          if (data.length && !prefilledClient && !editingInvoiceId) {
             setSelectedClientId(data[0].id);
          }
        }
      } finally {
        if (!cancelled) setLoadingClients(false);
      }
    };

    // Helper to fetch existing invoice if editing
    const loadDraft = async () => {
      if (!editingInvoiceId) return;
      try {
        const token = localStorage.getItem("token");
        console.log('submit payload:', {isEditing: !!editingInvoiceId, editingInvoiceId, op: "update_draft" });
        const res = await fetch(`${API_BASE}/invoices/${editingInvoiceId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        
        if (!cancelled && res.ok) {
           setSelectedClientId(data.clientId);
           setIssueDate(data.issueDate.split('T')[0]);
           setDueDate(data.dueDate.split('T')[0]);
           setItems(data.items.map((it: any) => ({
             id: it.id, description: it.description, quantity: it.quantity, price: it.rate
           })));
        }
      } catch(e) {
         toast.error("Failed to load draft");
      }
    };

    // If starting fresh
    if (!editingInvoiceId) {
      const today = new Date().toISOString().split("T")[0];
      const due = new Date();
      due.setMonth(due.getMonth() + 1);
      setIssueDate(today);
      setDueDate(due.toISOString().split("T")[0]);
      if (prefilledClient) setSelectedClientId(prefilledClient.id);
    }
  
    loadClients().then(() => {
      if (editingInvoiceId) loadDraft();
    });
  
    return () => { cancelled = true; };
  }, [isOpen, prefilledClient?.id, editingInvoiceId]);

  const addItem = () => {
    setItems((prev) =>[
      ...prev,
      { id: Date.now(), description: "", quantity: 1, price: 0 },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: number, patch: Partial<Omit<LineItem, "id">>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const calculateSubtotal = () =>
    items.reduce((acc, item) => acc + item.quantity * item.price, 0);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const submit = async (status: "DRAFT" | "PENDING") => {
    const clientId = prefilledClient
      ? prefilledClient.id
      : Number(selectedClientId);

    if (!clientId || Number.isNaN(clientId)) {
      toast.error("Select a client.");
      return;
    }

    const payloadItems = items
      .map((it) => ({
        description: it.description.trim(),
        quantity: it.quantity,
        rate: it.price,
      }))
      .filter((it) => it.description.length > 0 || it.rate > 0);

    if (payloadItems.length === 0) {
      toast.error("Add at least one line item with a description or amount.");
      return;
    }

    if (!dueDate) {
      toast.error("Due date is required.");
      return;
    }

    const isEditing = !!editingInvoiceId;
    
    const toastId = toast.loading(
      isEditing 
        ? (status === "DRAFT" ? "Updating draft…" : "Sending draft as invoice…")
        : (status === "DRAFT" ? "Saving draft…" : "Creating invoice…")
    );

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not signed in.");
        return;
      }

      setSaving(true);

      // Determine URL and Method based on whether we are editing
      const url = isEditing 
        ? `${API_BASE}/invoices/${editingInvoiceId}` 
        : `${API_BASE}/invoices`;
      const method = isEditing ? "PATCH" : "POST";

      // Build payload
      const payload: any = {
        clientId,
        issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
        dueDate: new Date(dueDate).toISOString(),
        status,
        items: payloadItems,
      };

      // Add the operation flag if we are patching an existing draft
      if (isEditing) {
        payload.op = "update_draft";
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.message === "string" ? data.message : "Could not save invoice.",
          { id: toastId }
        );
        return;
      }

      toast.success(
        isEditing 
          ? (status === "DRAFT" ? "Draft updated." : "Invoice sent.")
          : (status === "DRAFT" ? "Draft saved." : "Invoice created."),
        { id: toastId }
      );
      
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Network error.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const showClientPicker = !prefilledClient;

  const displayClient = useMemo(() => {
    if (prefilledClient) return prefilledClient;
    if (selectedClientId === "") return null;
    return clientList.find((c) => c.id === selectedClientId) ?? null;
  }, [prefilledClient, clientList, selectedClientId]);

  // Shared Input Class for consistency
  const inputClass = "w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#030213] shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#030213]/80 p-6 backdrop-blur-md">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              {editingInvoiceId ? "Edit Draft" : "Create New Invoice"}
            </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="space-y-8 p-8">
              
              {/* Client Selection */}
              {showClientPicker && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Client
                  </label>
                  {loadingClients ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading clients…
                    </div>
                  ) : clientList.length === 0 ? (
                    <p className="text-sm text-amber-600">
                      Add a client in the Clients tab before creating an invoice.
                    </p>
                  ) : (
                    <select
                      value={selectedClientId === "" ? "" : String(selectedClientId)}
                      onChange={(e) =>
                        setSelectedClientId(e.target.value ? Number(e.target.value) : "")
                      }
                      disabled={saving}
                      className={inputClass}
                    >
                      {clientList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Client Details Read-Only */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Client Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={displayClient?.name ?? ""}
                    placeholder="e.g. Acme Corp"
                    className={`${inputClass} read-only:bg-gray-50 dark:read-only:bg-gray-900/50 read-only:cursor-not-allowed`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Client Email
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={displayClient?.email ?? ""}
                    placeholder="billing@acme.com"
                    className={`${inputClass} read-only:bg-gray-50 dark:read-only:bg-gray-900/50 read-only:cursor-not-allowed`}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    disabled={saving}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={saving}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={saving}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors hover:text-indigo-500 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 items-end gap-3">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, { description: e.target.value })
                          }
                          disabled={saving}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, {
                              quantity: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          disabled={saving}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
                        />
                      </div>
                      <div className="col-span-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">
                            Ksh
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Price"
                            value={item.price || ""}
                            onChange={(e) =>
                              updateItem(item.id, {
                                price: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2 pl-10 pr-3 text-sm text-gray-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={saving || items.length <= 1}
                          className="p-2 text-gray-400 transition-colors hover:text-rose-500 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Calculation */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatKsh(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tax (10%)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatKsh(tax)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 text-xl font-bold">
                  <span className="text-gray-900 dark:text-white">Total Amount</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{formatKsh(total)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 pb-8">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => submit("DRAFT")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-4 font-bold transition-all hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => submit("PENDING")}
                  className="flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
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