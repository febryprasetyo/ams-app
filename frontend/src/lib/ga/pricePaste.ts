export function normalizePastedPrice(text: string): string | null {
  let value = text.trim().replace(/^Rp\.?\s*/i, '').replace(/\s/g, '');
  // Whole-rupiah prices may include a zero decimal suffix from currency formatting.
  const decimal = value.match(/[.,](\d{1,2})$/);
  if (decimal) {
    if (!/^0+$/.test(decimal[1])) return null;
    value = value.slice(0, -decimal[0].length);
  }
  if (!/^\d+(?:[.,]\d{3})*$/.test(value)) return null;
  return value.replace(/[.,]/g, '').replace(/^0+(?=\d)/, '');
}
