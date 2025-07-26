import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
  currentCurrency: string;
  exchangeRates: Record<string, number>;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number, currency?: string) => string;
  convertAmount: (amount: number, from: string, to: string) => number;
  updateExchangeRates: (rates: Record<string, number>) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currentCurrency: 'USD',
      exchangeRates: {
        USD: 1,
        EUR: 0.85,
        GBP: 0.75,
        JPY: 110,
        PHP: 56,
      },

      setCurrency: (currency: string) => {
        set({ currentCurrency: currency });
      },

      formatCurrency: (amount: number, currency?: string) => {
        const curr = currency || get().currentCurrency;

        const formatters: Record<string, Intl.NumberFormat> = {
          USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
          EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
          GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
          JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
          PHP: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }),
        };

        return formatters[curr]?.format(amount) || `${curr} ${amount.toFixed(2)}`;
      },

      convertAmount: (amount: number, from: string, to: string) => {
        const { exchangeRates } = get();
        const fromRate = exchangeRates[from] || 1;
        const toRate = exchangeRates[to] || 1;

        // Convert to USD first, then to target currency
        const usdAmount = amount / fromRate;
        return usdAmount * toRate;
      },

      updateExchangeRates: (rates: Record<string, number>) => {
        set((state) => ({
          exchangeRates: { ...state.exchangeRates, ...rates },
        }));
      },
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({
        currentCurrency: state.currentCurrency,
        exchangeRates: state.exchangeRates,
      }),
    }
  )
);
