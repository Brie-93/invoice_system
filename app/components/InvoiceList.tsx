"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  X,
  CheckCircle2,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api/app";

export type InvoiceLineItem = {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  invoiceId: number;
};

export type InvoiceApiRecord = {
  id: number;
  invoiceNo: string;
  status: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  client: { id: number; name: string; email: string };
  items?: InvoiceLineItem[];
};

type DisplayStatus =
  | "paid"
  | "pending"
  | "overdue"
  | "draft"
  | "partial"
  | "credit";

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function invoiceBalance(inv: Pick<InvoiceApiRecord, "totalAmount" | "amountPaid">) {
  return roundMoney(inv.totalAmount - (inv.amountPaid ?? 0));
}

function isDueOverdue(iso: string) {
  const due = new Date(iso);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  return due < startToday;
}

export function getDisplayStatus(inv: InvoiceApiRecord): DisplayStatus {
  const s = inv.status;
  if (s === "DRAFT") return "draft";
  const balance = invoiceBalance(inv);
  if (s === "OVERPAID" || balance < -0.005) return "credit";
  if (balance <= 0.005 || s === "PAID") return "paid";
  if (isDueOverdue(inv.dueDate)) return "overdue";
  if (s === "PARTIAL" || (inv.amountPaid ?? 0) > 0) return "partial";
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

function money(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildDownloadPayload(inv: InvoiceApiRecord) {
  const bal = invoiceBalance(inv);
  return {
    invoiceNo: inv.invoiceNo,
    status: inv.status,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    totalAmount: inv.totalAmount,
    amountPaid: inv.amountPaid ?? 0,
    balanceDue: bal > 0 ? bal : 0,
    creditToClient: bal < 0 ? -bal : 0,
    client: inv.client,
    lineItems: (inv.items ?? []).map((it) => ({
      description: it.description,
      quantity: it.quantity,
      rate: it.rate,
      lineTotal: roundMoney(it.quantity * it.rate),
    })),
    downloadedAt: new Date().toISOString(),
  };
}

function downloadInvoiceFile(inv: InvoiceApiRecord) {
  const payload = buildDownloadPayload(inv);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const safe = inv.invoiceNo.replace(/[^a-z0-9-_]/gi, "_");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}_invoice.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Invoice downloaded.");
}

export interface InvoiceListProps {
  refreshKey?: number;
  onCreateInvoice?: () => void;
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

  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [viewId, setViewId] = useState<number | null>(null);
  const [viewInvoice, setViewInvoice] = useState<InvoiceApiRecord | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [partialFor, setPartialFor] = useState<InvoiceApiRecord | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialSaving, setPartialSaving] = useState(false);

  const [overpayFor, setOverpayFor] = useState<InvoiceApiRecord | null>(null);
  const [overpayTotal, setOverpayTotal] = useState("");
  const [overpaySaving, setOverpaySaving] = useState(false);

  const [paymentBusyId, setPaymentBusyId] = useState<number | null>(null);

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
      const list = Array.isArray(data) ? data : [];
      setInvoices(
        list.map((inv: InvoiceApiRecord) => ({
          ...inv,
          amountPaid: inv.amountPaid ?? 0,
        }))
      );
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

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (viewId == null) {
      setViewInvoice(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setViewLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_BASE}/invoices/${viewId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && data) {
          setViewInvoice({
            ...data,
            amountPaid: data.amountPaid ?? 0,
          });
        }
      } finally {
        if (!cancelled) setViewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const amt = inv.totalAmount.toFixed(2);
      const bal = invoiceBalance(inv).toFixed(2);
      return (
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.client.name.toLowerCase().includes(q) ||
        inv.client.email.toLowerCase().includes(q) ||
        amt.includes(q) ||
        bal.includes(q)
      );
    });
  }, [invoices, search]);

  const getStatusColor = (status: DisplayStatus) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/15 text-emerald-700 border-emerald-500/25";
      case "pending":
        return "bg-amber-500/15 text-amber-700 border-amber-500/25";
      case "overdue":
        return "bg-rose-500/15 text-rose-700 border-rose-500/30";
      case "draft":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      case "partial":
        return "bg-amber-500/15 text-amber-800 border-amber-500/25";
      case "credit":
        return "bg-sky-500/15 text-sky-800 border-sky-500/25";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const labelForDisplay = (s: DisplayStatus) => {
    switch (s) {
      case "draft":
        return "Draft";
      case "credit":
        return "Credit";
      case "partial":
        return "Partial";
      default:
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
  };

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : null;
  };

  const runDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    const toastId = toast.loading(
      confirm.kind === "invoice" ? "Deleting invoice…" : "Deleting client…"
    );
    try {
      const headers = authHeaders();
      if (!headers) {
        toast.error("You are not signed in.", { id: toastId });
        return;
      }
      const path =
        confirm.kind === "invoice"
          ? `${API_BASE}/invoices/${confirm.id}`
          : `${API_BASE}/clients/${confirm.id}`;
      const res = await fetch(path, { method: "DELETE", headers });
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

  const patchPayment = async (
    id: number,
    body: Record<string, unknown>,
    successMsg: string
  ) => {
    const headers = authHeaders();
    if (!headers) {
      toast.error("You are not signed in.");
      return;
    }
    setPaymentBusyId(id);
    const toastId = toast.loading("Updating invoice…");
    try {
      const res = await fetch(`${API_BASE}/invoices/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.message === "string" ? data.message : "Update failed.",
          { id: toastId }
        );
        return;
      }
      toast.success(successMsg, { id: toastId });
      onDataChanged?.();
      await fetchInvoices();
    } catch {
      toast.error("Network error.", { id: toastId });
    } finally {
      setPaymentBusyId(null);
    }
  };

  const markFullyPaid = (inv: InvoiceApiRecord) => {
    setMenuOpenId(null);
    void patchPayment(inv.id, { op: "mark_fully_paid" }, "Marked fully paid.");
  };

  const submitPartial = async () => {
    if (!partialFor) return;
    const amt = Number(partialAmount);
    if (!(amt > 0)) {
      toast.error("Enter a positive amount.");
      return;
    }
    setPartialSaving(true);
    const toastId = toast.loading("Recording payment…");
    try {
      const headers = authHeaders();
      if (!headers) {
        toast.error("You are not signed in.", { id: toastId });
        return;
      }
      const res = await fetch(`${API_BASE}/invoices/${partialFor.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ op: "add_payment", amount: amt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.message === "string" ? data.message : "Could not record payment.",
          { id: toastId }
        );
        return;
      }
      toast.success("Payment recorded.", { id: toastId });
      setPartialFor(null);
      setPartialAmount("");
      onDataChanged?.();
      await fetchInvoices();
    } catch {
      toast.error("Network error.", { id: toastId });
    } finally {
      setPartialSaving(false);
    }
  };

  const submitOverpay = async () => {
    if (!overpayFor) return;
    const tr = Number(overpayTotal);
    if (!(tr > overpayFor.totalAmount)) {
      toast.error(
        `Total received must be greater than invoice total (${money(overpayFor.totalAmount)}).`
      );
      return;
    }
    setOverpaySaving(true);
    const toastId = toast.loading("Recording overpayment…");
    try {
      const headers = authHeaders();
      if (!headers) {
        toast.error("You are not signed in.", { id: toastId });
        return;
      }
      const res = await fetch(`${API_BASE}/invoices/${overpayFor.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ op: "record_overpayment", totalReceived: tr }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.message === "string" ? data.message : "Could not save.",
          { id: toastId }
        );
        return;
      }
      toast.success("Credit to client recorded.", { id: toastId });
      setOverpayFor(null);
      setOverpayTotal("");
      onDataChanged?.();
      await fetchInvoices();
    } catch {
      toast.error("Network error.", { id: toastId });
    } finally {
      setOverpaySaving(false);
    }
  };

  const openPartial = (inv: InvoiceApiRecord) => {
    setMenuOpenId(null);
    setPartialFor(inv);
    setPartialAmount("");
  };

  const openOverpay = (inv: InvoiceApiRecord) => {
    setMenuOpenId(null);
    setOverpayFor(inv);
    setOverpayTotal("");
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
                    const bal = invoiceBalance(invoice);
                    const settled = bal <= 0.005 && display !== "credit";
                    const busy = paymentBusyId === invoice.id;

                    return (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group transition-colors hover:bg-muted/20"
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
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold">
                              ${money(invoice.totalAmount)}
                            </span>
                            {bal > 0.005 && (
                              <span className="text-xs text-rose-600/90">
                                Due ${money(bal)}
                              </span>
                            )}
                            {display === "credit" && bal < -0.005 && (
                              <span className="text-xs text-sky-700">
                                Credit ${money(-bal)}
                              </span>
                            )}
                            {(invoice.amountPaid ?? 0) > 0 &&
                              bal > 0.005 && (
                                <span className="text-xs text-muted-foreground">
                                  Paid ${money(invoice.amountPaid)}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(display)}`}
                          >
                            {labelForDisplay(display)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                            <button
                              type="button"
                              className="rounded-lg p-2 text-indigo-500 transition-colors hover:bg-indigo-500/10"
                              title="View invoice"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewId(invoice.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                              title="Download invoice JSON"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadInvoiceFile(invoice);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-500/10"
                              title="Delete invoice"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirm({
                                  kind: "invoice",
                                  id: invoice.id,
                                  label: invoice.invoiceNo,
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-500/10"
                              title="Delete client and all invoices"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirm({
                                  kind: "client",
                                  id: invoice.client.id,
                                  name: invoice.client.name,
                                });
                              }}
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                            <div className="relative" ref={menuOpenId === invoice.id ? menuRef : null}>
                              <button
                                type="button"
                                className={`rounded-lg p-2 transition-colors hover:bg-muted ${menuOpenId === invoice.id ? "bg-muted" : "text-muted-foreground"}`}
                                title="Payment actions"
                                aria-expanded={menuOpenId === invoice.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId((id) =>
                                    id === invoice.id ? null : invoice.id
                                  );
                                }}
                                disabled={busy}
                              >
                                {busy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </button>
                              {menuOpenId === invoice.id && (
                                <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border/40 bg-card py-1 text-left text-sm shadow-xl">
                                  <button
                                    type="button"
                                    disabled={settled || busy}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markFullyPaid(invoice);
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    Fully paid
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      settled || busy || bal <= 0.005
                                    }
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPartial(invoice);
                                    }}
                                  >
                                    <CircleDollarSign className="h-4 w-4 text-amber-600" />
                                    Partial payment…
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOverpay(invoice);
                                    }}
                                  >
                                    <TrendingUp className="h-4 w-4 text-sky-600" />
                                    Client overpaid…
                                  </button>
                                </div>
                              )}
                            </div>
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

      {/* View invoice */}
      <AnimatePresence>
        {viewId !== null && (
          <motion.div
            key="view-inv"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
              aria-label="Close"
              onClick={() => setViewId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                <h2 className="text-lg font-semibold">Invoice details</h2>
                <button
                  type="button"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                  onClick={() => setViewId(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-5 text-sm">
                {viewLoading || !viewInvoice ? (
                  <div className="flex justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {viewInvoice.invoiceNo}
                    </p>
                    <p className="mt-1 text-foreground">
                      {viewInvoice.client.name} · {viewInvoice.client.email}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-muted-foreground">
                      <div>
                        <p className="text-xs uppercase">Issued</p>
                        <p className="font-medium text-foreground">
                          {formatInvoiceDate(viewInvoice.issueDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase">Due</p>
                        <p className="font-medium text-foreground">
                          {formatInvoiceDate(viewInvoice.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-border/40 pt-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Line items
                      </p>
                      <ul className="mt-2 space-y-2">
                        {(viewInvoice.items ?? []).map((it) => (
                          <li
                            key={it.id}
                            className="flex justify-between gap-2 border-b border-border/20 pb-2 last:border-0"
                          >
                            <span>
                              {it.description}{" "}
                              <span className="text-muted-foreground">
                                ×{it.quantity}
                              </span>
                            </span>
                            <span className="shrink-0 font-medium">
                              ${money(it.quantity * it.rate)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 space-y-1 border-t border-border/40 pt-4">
                      <div className="flex justify-between font-semibold">
                        <span>Invoice total</span>
                        <span>${money(viewInvoice.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Amount paid</span>
                        <span>${money(viewInvoice.amountPaid ?? 0)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-foreground">
                        <span>
                          {invoiceBalance(viewInvoice) < -0.005
                            ? "Credit (you owe client)"
                            : invoiceBalance(viewInvoice) > 0.005
                              ? "Amount due"
                              : "Balance"}
                        </span>
                        <span
                          className={
                            invoiceBalance(viewInvoice) < -0.005
                              ? "text-sky-700"
                              : invoiceBalance(viewInvoice) > 0.005
                                ? "text-rose-600"
                                : "text-emerald-600"
                          }
                        >
                          $
                          {money(
                            Math.abs(invoiceBalance(viewInvoice))
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(getDisplayStatus(viewInvoice))}`}
                      >
                        {labelForDisplay(getDisplayStatus(viewInvoice))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partial payment */}
      <AnimatePresence>
        {partialFor && (
          <motion.div
            key="partial-pay"
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => !partialSaving && setPartialFor(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border/40 bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">Partial payment</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {partialFor.invoiceNo} · Balance due{" "}
                <strong>${money(invoiceBalance(partialFor))}</strong>
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase text-muted-foreground">
                Payment amount ($)
              </label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="0.00"
                disabled={partialSaving}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={partialSaving}
                  onClick={() => setPartialFor(null)}
                  className="rounded-xl border border-border/40 px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={partialSaving}
                  onClick={() => void submitPartial()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {partialSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Apply payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overpayment */}
      <AnimatePresence>
        {overpayFor && (
          <motion.div
            key="overpay"
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => !overpaySaving && setOverpayFor(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border/40 bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">Client overpaid</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Invoice total <strong>${money(overpayFor.totalAmount)}</strong>.
                Enter the <strong>total amount received</strong> (must be greater
                than the invoice) so we record the credit you owe the client.
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase text-muted-foreground">
                Total received ($)
              </label>
              <input
                type="number"
                min={overpayFor.totalAmount + 0.01}
                step="0.01"
                value={overpayTotal}
                onChange={(e) => setOverpayTotal(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="0.00"
                disabled={overpaySaving}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={overpaySaving}
                  onClick={() => setOverpayFor(null)}
                  className="rounded-xl border border-border/40 px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={overpaySaving}
                  onClick={() => void submitOverpay()}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                >
                  {overpaySaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Record credit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
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
