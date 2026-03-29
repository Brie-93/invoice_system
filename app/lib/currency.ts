/** Base display currency for the app (Kenyan Shilling) */
export const CURRENCY_LABEL = "Ksh";

const LOCALE = "en-KE";

export function formatKsh(amount: number): string {
  const n = amount.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY_LABEL}\u00A0${n}`;
}

/** Number only, for tight layouts where prefix is shown separately */
export function formatKshNumber(amount: number): string {
  return amount.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
