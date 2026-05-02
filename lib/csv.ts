function escape(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows: Record<string, unknown>[], headers?: string[]): string {
  if (rows.length === 0) return (headers ?? []).join(',') + '\n';
  const cols = headers ?? Object.keys(rows[0]);
  const lines = [cols.join(',')];
  for (const r of rows) {
    lines.push(cols.map((c) => escape(r[c])).join(','));
  }
  return lines.join('\n');
}
