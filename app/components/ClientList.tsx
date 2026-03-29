// app/components/ClientList.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Mail,
  MapPin,
  X,
  Loader2,
  FileText,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type Client = {
  id: number;
  name: string;
  email: string;
  address: string | null;
  _count: { invoices: number };
};

const API_BASE = "http://localhost:3001/api/app";

function initialFromName(name: string) {
  const t = name.trim();
  if (!t) return "?";
  return t[0]?.toUpperCase() ?? "?";
}

export type ClientCardPayload = {
  id: number;
  name: string;
  email: string;
};

export interface ClientListProps {
  /** Opens the invoice form on the Invoices tab with this client pre-filled */
  onCreateInvoiceForClient?: (client: ClientCardPayload) => void;
  refreshKey?: number;
}

export const ClientList: React.FC<ClientListProps> = ({
  onCreateInvoiceForClient,
  refreshKey = 0,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
  });

  const fetchClients = useCallback(async () => {
    setListLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not signed in.");
        setClients([]);
        return;
      }
      const res = await fetch(`${API_BASE}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.message === "string"
            ? data.message
            : "Failed to load clients."
        );
        setClients([]);
        return;
      }
      setClients(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not reach the server. Try again.");
      setClients([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients, refreshKey]);

  const openModal = () => {
    setFormData({ name: "", email: "", address: "" });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    const email = formData.email.trim();
    if (!name || !email) {
      toast.error("Name and email are required.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Saving client…");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not signed in.", { id: toastId });
        return;
      }
      const res = await fetch(`${API_BASE}/clients`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          address: formData.address.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data?.message === "string"
            ? data.message
            : "Could not save client.",
          { id: toastId }
        );
        return;
      }
      toast.success("Client added successfully.", { id: toastId });
      setModalOpen(false);
      setFormData({ name: "", email: "", address: "" });
      await fetchClients();
    } catch {
      toast.error("Network error while saving.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">
            Clients
          </h1>
          <p className="mt-1 text-gray-500">
            Everyone you bill — organized in a clear, scannable grid.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-5 w-5" />
          Add client
        </button>
      </div>

      {listLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white shadow-sm"
            />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/80 px-8 py-20 text-center shadow-sm backdrop-blur-sm"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">No clients yet</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Add your first client to start linking invoices and tracking work in
            one place.
          </p>
          <button
            type="button"
            onClick={openModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            New client
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client, index) => {
            const interactive = !!onCreateInvoiceForClient;
            return (
            <motion.article
              key={client.id}
              layout
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={
                interactive
                  ? () =>
                      onCreateInvoiceForClient({
                        id: client.id,
                        name: client.name,
                        email: client.email,
                      })
                  : undefined
              }
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onCreateInvoiceForClient({
                          id: client.id,
                          name: client.name,
                          email: client.email,
                        });
                      }
                    }
                  : undefined
              }
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 320, damping: 26 }}
              className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                interactive
                  ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2"
                  : ""
              }`}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 text-lg font-semibold text-white shadow-inner">
                  {initialFromName(client.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-gray-900">
                    {client.name}
                  </h3>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0 text-indigo-500/80" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.address ? (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500/80" />
                        <span className="line-clamp-2 text-gray-500">
                          {client.address}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No address on file</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  {client._count.invoices}{" "}
                  {client._count.invoices === 1 ? "invoice" : "invoices"}
                </span>
              </div>
            </motion.article>
          );
          })}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="client-modal-layer"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <button
              type="button"
              aria-label="Close dialog"
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
              onClick={closeModal}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="client-modal-title"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-900/15"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80 px-6 py-4">
                  <div>
                    <h2
                      id="client-modal-title"
                      className="text-lg font-serif font-bold text-gray-900"
                    >
                      New client
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Details sync to your workspace immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                  <div>
                    <label
                      htmlFor="client-name"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Name
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, name: e.target.value }))
                      }
                      disabled={saving}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                      placeholder="Studio or contact name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="client-email"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Email
                    </label>
                    <input
                      id="client-email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, email: e.target.value }))
                      }
                      disabled={saving}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                      placeholder="billing@company.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="client-address"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Address{" "}
                      <span className="font-normal normal-case text-gray-400">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="client-address"
                      rows={3}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, address: e.target.value }))
                      }
                      disabled={saving}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                      placeholder="Street, city, region…"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-70"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Save client
                        </>
                      )}
                    </button>
                  </div>
                </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
