"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, Users, Building2, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatKsh } from "../lib/currency";

const API_BASE = "https://invoice-system-backend-au29.onrender.com/api/app";

type AppUser = {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
};

type HistoryInvoice = {
  id: number;
  invoiceNo: string;
  status: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  items: { id: number; description: string; quantity: number; rate: number }[];
};

type ClientWithInvoices = {
  id: number;
  name: string;
  email: string;
  address: string | null;
  invoices: HistoryInvoice[];
};

type RecordsPayload = {
  users: AppUser[];
  clients: ClientWithInvoices[];
  generatedAt: string;
};

interface RecordsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export const RecordsHistoryModal: React.FC<RecordsHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<RecordsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [openClients, setOpenClients] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("You are not signed in.");
          return;
        }
        const res = await fetch(`${API_BASE}/records`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(
            typeof json?.message === "string" ? json.message : "Could not load records."
          );
          return;
        }
        if (!cancelled && json) setData(json as RecordsPayload);
      } catch {
        if (!cancelled) toast.error("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const toggleClient = (id: number) => {
    setOpenClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-stretch justify-end sm:justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="records-title"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-2xl sm:h-[min(90vh,800px)] sm:rounded-2xl sm:border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 id="records-title" className="text-lg font-serif font-bold text-gray-900">
                  Records &amp; history
                </h2>
                <p className="text-xs text-gray-500">
                  App users, clients, and every invoice on file
                  {data?.generatedAt
                    ? ` · snapshot ${formatWhen(data.generatedAt)}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  Loading full records…
                </div>
              ) : !data ? (
                <p className="py-12 text-center text-sm text-gray-500">No data.</p>
              ) : (
                <div className="space-y-8">
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      <Users className="h-4 w-4" />
                      App users ({data.users.length})
                    </h3>
                    {data.users.length === 0 ? (
                      <p className="text-sm text-gray-500">No registered users.</p>
                    ) : (
                      <ul className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                        {data.users.map((u) => (
                          <li
                            key={u.id}
                            className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm"
                          >
                            <span className="font-medium text-gray-900">{u.email}</span>
                            {u.name ? (
                              <span className="text-gray-600"> · {u.name}</span>
                            ) : null}
                            <span className="mt-0.5 block text-xs text-gray-400">
                              Joined {formatWhen(u.createdAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      <Building2 className="h-4 w-4" />
                      Clients &amp; invoices ({data.clients.length} clients)
                    </h3>
                    {data.clients.length === 0 ? (
                      <p className="text-sm text-gray-500">No clients yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {data.clients.map((c) => {
                          const expanded = openClients.has(c.id);
                          return (
                            <li
                              key={c.id}
                              className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                            >
                              <button
                                type="button"
                                onClick={() => toggleClient(c.id)}
                                className="flex w-full items-start gap-2 px-3 py-3 text-left transition hover:bg-gray-50"
                              >
                                {expanded ? (
                                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                ) : (
                                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900">{c.name}</p>
                                  <p className="text-xs text-gray-500">{c.email}</p>
                                  <p className="mt-1 text-xs text-indigo-600">
                                    {c.invoices.length}{" "}
                                    {c.invoices.length === 1 ? "invoice" : "invoices"}
                                  </p>
                                </div>
                              </button>
                              {expanded && (
                                <ul className="border-t border-gray-100 bg-gray-50/80 px-3 py-2">
                                  {c.invoices.length === 0 ? (
                                    <li className="py-2 text-xs text-gray-500">
                                      No invoices for this client.
                                    </li>
                                  ) : (
                                    c.invoices.map((inv) => (
                                      <li
                                        key={inv.id}
                                        className="border-b border-gray-100 py-2 last:border-0"
                                      >
                                        <div className="flex flex-wrap items-center gap-2">
                                          <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                          <span className="font-medium text-indigo-600">
                                            {inv.invoiceNo}
                                          </span>
                                          <span className="rounded-full bg-gray-200/80 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-700">
                                            {inv.status}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-600">
                                          Issued {formatWhen(inv.issueDate)} · Total{" "}
                                          {formatKsh(inv.totalAmount)} · Paid{" "}
                                          {formatKsh(inv.amountPaid ?? 0)}
                                        </p>
                                        {inv.items.length > 0 && (
                                          <ul className="mt-1.5 space-y-0.5 border-l-2 border-indigo-200 pl-2 text-xs text-gray-500">
                                            {inv.items.map((it) => (
                                              <li key={it.id}>
                                                {it.description}{" "}
                                                <span className="text-gray-400">
                                                  ×{it.quantity} @ {formatKsh(it.rate)}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </li>
                                    ))
                                  )}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
