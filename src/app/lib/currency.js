/**
 * Iraqi Dinar — ISO 4217 code IQD.
 * Default display currency for Iraq deployment.
 */
export const APP_CURRENCY = 'IQD';

export function formatCurrency(amount, code = APP_CURRENCY) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${code} 0`;
  const frac = Math.abs(n % 1);
  const body = frac > 1e-9 ? n.toFixed(2) : String(Math.round(n));
  return `${code} ${body}`;
}

/** Two decimal places (lists, orders). */
export function formatCurrencyFixed2(amount, code = APP_CURRENCY) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${code} 0.00`;
  return `${code} ${n.toFixed(2)}`;
}

/** Extra charge next to option name, e.g. +IQD 500 */
export function formatOptionDelta(amount, code = APP_CURRENCY) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) return `+${code} 0`;
  const frac = Math.abs(n % 1);
  const body = frac > 1e-9 ? n.toFixed(2) : String(Math.round(n));
  return `+${code} ${body}`;
}
