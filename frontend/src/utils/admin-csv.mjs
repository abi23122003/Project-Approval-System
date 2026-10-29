export const toAdminCsv = (rows) => {
  const escapeCell = (value) => {
    const cell = String(value ?? '');
    const safeCell = /^[\t\r ]*[=+\-@]/.test(cell) ? `'${cell}` : cell;
    return `"${safeCell.replace(/"/g, '""')}"`;
  };
  return rows.map(row => row.map(escapeCell).join(',')).join('\r\n');
};
