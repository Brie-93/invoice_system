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
  onSuccess?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  isOpen,
  onClose,
  prefilledClient = null,
  onSuccess,
}) => {
  const [items, setItems] = useState<LineItem[]>([
    { id: Date.now(), description: "", quantity: 1, price: 0 },
  ]);
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [clientList, setClientList] = useState<ApiClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().split("T")[0];
    const due = new Date();
    due.setMonth(due.getMonth() + 1);
    setIssueDate(today);
    setDueDate(due.toISOString().split("T")[0]);
    setItems([{ id: Date.now(), description: "", quantity: 1, price: 0 }]);

    if (prefilledClient) {
      setSelectedClientId(prefilledClient.id);
      return;
    }

    setSelectedClientId("");
    let cancelled = false;
    (async () => {
      setLoadingClients(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_BASE}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => []);
        if (cancelled || !res.ok || !Array.isArray(data)) return;
        setClientList(data);
        if (data.length) setSelectedClientId(data[0].id);
      } finally {
        if (!cancelled) setLoadingClients(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, prefilledClient?.id, prefilledClient?.email, prefilledClient?.name]);

  const addItem = () => {
    setItems((prev) => [
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

    setSaving(true);
    const toastId = toast.loading(
      status === "DRAFT" ? "Saving draft…" : "Creating invoice…"
    );
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not signed in.", { id: toastId });
        return;
      }
      const res = await fetch(`${API_BASE}/invoices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
          dueDate: new Date(dueDate).toISOString(),
          status,
          items: payloadItems,
        }),
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
        status === "DRAFT" ? "Draft saved." : "Invoice created.",
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto border-l border-border/40 bg-background shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/80 p-6 backdrop-blur-md">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                Create New Invoice
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="rounded-full p-2 transition-colors hover:bg-muted disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-8 p-8">
              {showClientPicker && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Client
                  </label>
                  {loadingClients ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                        setSelectedClientId(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      disabled={saving}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
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

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Client Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={displayClient?.name ?? ""}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 read-only:cursor-not-allowed read-only:opacity-90"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Client Email
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={displayClient?.email ?? ""}
                    placeholder="billing@acme.com"
                    className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 read-only:cursor-not-allowed read-only:opacity-90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={saving}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-500 transition-colors hover:text-indigo-400 disabled:opacity-50"
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
                          className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
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
                          className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                        />
                      </div>
                      <div className="col-span-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">
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
                            className="w-full rounded-lg border border-border/40 bg-muted/20 py-2 pl-10 pr-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={saving || items.length <= 1}
                          className="p-2 text-muted-foreground transition-colors hover:text-rose-500 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-border/40 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatKsh(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-semibold">{formatKsh(tax)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/10 pt-2 text-xl font-bold">
                  <span>Total Amount</span>
                  <span className="text-indigo-500">{formatKsh(total)}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => submit("DRAFT")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-muted py-4 font-bold transition-all hover:bg-muted/80 disabled:opacity-60"
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
                  className="flex flex-[1.2] items-center justify-center gap-2 rounded-xl bg-indigo-500 py-4 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 active:scale-95 disabled:opacity-60"
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
