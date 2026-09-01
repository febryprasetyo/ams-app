export function allocateSequentialCodes(
  prefix: string,
  year: number,
  existingCodes: string[],
  count: number,
): string[] {
  if (count <= 0) return [];

  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i');
  let maxSeq = 0;

  for (const code of existingCodes) {
    const match = code.trim().match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    const nextSeq = maxSeq + i;
    result.push(`${prefix}-${year}-${nextSeq.toString().padStart(4, '0')}`);
  }

  return result;
}
