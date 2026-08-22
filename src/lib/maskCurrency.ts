const MASK = "R$ ••••••";

export function maskCurrency(formatted: string, hidden: boolean): string {
  return hidden ? MASK : formatted;
}
