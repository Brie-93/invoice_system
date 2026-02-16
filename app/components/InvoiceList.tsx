import React from 'react';
import { MoreHorizontal, Download, Eye, Trash2, Search, Filter, ArrowUpDown } from 'lucide-react';
import { motion } from 'motion/react';

export interface Invoice {
  id: string;
  client: string;
  email: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
}

const mockInvoices: Invoice[] = [
  { id: 'INV-2024-001', client: 'Acme Corp', email: 'billing@acme.com', amount: 2450.00, status: 'paid', date: 'Feb 12, 2024' },
  { id: 'INV-2024-002', client: 'Starlight Inc', email: 'hello@starlight.io', amount: 1200.00, status: 'pending', date: 'Feb 14, 2024' },
  { id: 'INV-2024-003', client: 'Global Dynamics', email: 'finance@global.com', amount: 5600.00, status: 'overdue', date: 'Jan 28, 2024' },
  { id: 'INV-2024-004', client: 'Cyberdyne Systems', email: 'sarah@cyberdyne.net', amount: 890.00, status: 'paid', date: 'Feb 10, 2024' },
  { id: 'INV-2024-005', client: 'Wayne Enterprises', email: 'bruce@wayne.com', amount: 15400.00, status: 'pending', date: 'Feb 15, 2024' },
  { id: 'INV-2024-006', client: 'Oscorp Industries', email: 'norman@oscorp.com', amount: 3200.00, status: 'paid', date: 'Feb 08, 2024' },
];

export const InvoiceList: React.FC = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'overdue': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your billing documents.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border/40 hover:bg-muted rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/40 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search invoices, clients, or amounts..." 
                className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border/40 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Displaying 6 of 124 invoices</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">
                  <button className="flex items-center gap-2 hover:text-foreground transition-colors uppercase">
                    Invoice ID <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">
                  <button className="flex items-center gap-2 hover:text-foreground transition-colors uppercase">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mockInvoices.map((invoice, idx) => (
                <motion.tr 
                  key={invoice.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-muted/20 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-indigo-500">{invoice.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{invoice.client}</span>
                      <span className="text-xs text-muted-foreground">{invoice.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold">${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-indigo-500/10 text-indigo-500 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border/40 flex items-center justify-between">
          <button className="px-4 py-2 border border-border/40 rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors" disabled>
            Previous
          </button>
          <div className="flex items-center gap-2">
            {[1, 2, 3, '...', 12].map((page, i) => (
              <button 
                key={i}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === 1 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-muted text-muted-foreground'}`}
              >
                {page}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 border border-border/40 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
