"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Loader2,
  UserX,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/app";

export type InvoiceApiRecord = {
  id: number;
  invoiceNo: string;
  status: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  client: { id: number; name: string; email: string };
};

type DisplayStatus = "paid" | "pending" | "overdue" | "draft";

function getDisplayStatus(inv: InvoiceApiRecord): DisplayStatus {
  const s = inv.status;
  if (s === "PAID") return "paid";
  if (s === "DRAFT") return "draft";
  const due = new Date(inv.dueDate);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  if (s === "PENDING" && due < startToday) return "overdue";
  return "pending";
}

function formatInvoiceDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export interface InvoiceListProps {
  refreshKey?: number;
  onCreateInvoice?: () => void;
  /** Called after invoice or client delete so other tabs (e.g. clients) can refetch */
  onDataChanged?: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  refreshKey = 0,
  onCreateInvoice,
  onDataChanged,
}) => {
  const [invoices, setInvoices] = useState<InvoiceApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState<
    | null
    | { kind: "invoice"; id: number; label: string }
    | { kind: "client"; id: number; name: string }
  >(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not signed in.");
        setInvoices([]);
        return;
      }
      const res = await fetch(`${API_BASE}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.message === "string"
            ? data.message
            : "Failed to load invoices."
        );
        setInvoices([]);
        return;
      }
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not reach the server.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const amt = inv.totalAmount.toFixed(2);
      return (
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.client.name.toLowerCase().includes(q) ||
        inv.client.email.toLowerCase().includes(q) ||
        amt.includes(q)
      );
    });
  }, [invoices, search]);

  const getStatusColor = (status: DisplayStatus) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "overdue":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "draft":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const labelForDisplay = (s: DisplayStatus) => {
    if (s === "draft") return "Draft";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const runDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    const toastId = toast.loading(
      confirm.kind === "invoice" ? "Deleting invoice…" : "Deleting client…"
    );
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not signed in.", { id: toastId });
        return;
      }
      const path =
        confirm.kind === "invoice"
          ? `${API_BASE}/invoices/${confirm.id}`
          : `${API_BASE}/clients/${confirm.id}`;
      const res = await fetch(path, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.message === "string" ? data.message : "Delete failed.",
          { id: toastId }
        );
        return;
      }
      toast.success(
        confirm.kind === "invoice"
          ? "Invoice removed."
          : "Client and their invoices removed.",
        { id: toastId }
      );
      setConfirm(null);
      onDataChanged?.();
      await fetchInvoices();
    } catch {
      toast.error("Network error.", { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 space-y-6 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track all your billing documents.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {onCreateInvoice && (
            <button
              type="button"
              onClick={onCreateInvoice}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              New invoice
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-border/40 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 p-4">
          <div className="flex min-w-[300px] flex-1 flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices, clients, or amounts..."
                className="w-full rounded-lg border border-border/40 bg-muted/30 py-2 pl-9 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {loading
                ? "Loading…"
                : `Displaying ${filtered.length} of ${invoices.length} invoices`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading invoices…
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      className="flex items-center gap-2 uppercase transition-colors hover:text-foreground"
                    >
                      Invoice ID <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      className="flex items-center gap-2 uppercase transition-colors hover:text-foreground"
                    >
                      Date <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-sm text-muted-foreground"
                    >
                      {invoices.length === 0
                        ? "No invoices yet. Create one from a client card or with “New invoice”."
                        : "No matches for your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((invoice, idx) => {
                    const display = getDisplayStatus(invoice);
                    return (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group cursor-pointer transition-colors hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-indigo-500">
                            {invoice.invoiceNo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {invoice.client.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {invoice.client.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatInvoiceDate(invoice.issueDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold">
                            $
                            {invoice.totalAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(display)}`}
                          >
                            {labelForDisplay(display)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                            <button
                              type="button"
                              className="rounded-lg p-2 text-indigo-500 transition-colors hover:bg-indigo-500/10"
                              title="View (coming soon)"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                              title="Download (coming soon)"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-500/10"
                              title="Delete invoice"
                              onClick={() =>
                                setConfirm({
                                  kind: "invoice",
                                  id: invoice.id,
                                  label: invoice.invoiceNo,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-500/10"
                              title="Delete client and all invoices"
                              onClick={() =>
                                setConfirm({
                                  kind: "client",
                                  id: invoice.client.id,
                                  name: invoice.client.name,
                                })
                              }
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                              title="More"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/40 p-4">
          <button
            type="button"
            className="rounded-lg border border-border/40 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            disabled
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">Page 1</span>
          <button
            type="button"
            className="rounded-lg border border-border/40 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            disabled
          >
            Next
          </button>
        </div>
      </div>

      <AnimatePresence>
        {confirm !== null && (
          <motion.div
            key="delete-confirm"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => !deleting && setConfirm(null)}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border/40 bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="delete-confirm-title"
                className="text-lg font-semibold text-foreground"
              >
                {confirm.kind === "client"
                  ? "Delete client?"
                  : "Delete invoice?"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {confirm.kind === "invoice" && (
                  <>
                    This will permanently remove invoice{" "}
                    <strong className="text-foreground">{confirm.label}</strong>.
                    This cannot be undone.
                  </>
                )}
                {confirm.kind === "client" && (
                  <>
                    This will remove{" "}
                    <strong className="text-foreground">{confirm.name}</strong>{" "}
                    and <strong className="text-foreground">all of their invoices</strong>.
                    This cannot be undone.
                  </>
                )}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirm(null)}
                  className="rounded-xl border border-border/40 px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => runDelete()}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
