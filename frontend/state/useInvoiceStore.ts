import { create } from 'zustand';

interface InvoiceState {
  invoices: any[];
  clients: any[];
  selectedInvoice: any | null;
  setInvoices: (invoices: any[]) => void;
  setClients: (clients: any[]) => void;
  setSelectedInvoice: (invoice: any | null) => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  clients: [],
  selectedInvoice: null,
  setInvoices: (invoices) => set({ invoices }),
  setClients: (clients) => set({ clients }),
  setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),
}));
