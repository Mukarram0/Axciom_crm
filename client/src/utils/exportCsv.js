/**
 * Client-Side CSV Export Utility
 * Converts Javascript object array into a RFC-4180 compliant downloadable CSV file.
 */

export const exportToCsv = (filename, data, headers) => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const columnHeaders = headers ? headers.map((h) => h.label) : Object.keys(data[0]);
  const columnKeys = headers ? headers.map((h) => h.key) : Object.keys(data[0]);

  const csvRows = [];
  csvRows.push(columnHeaders.join(','));

  data.forEach((row) => {
    const values = columnKeys.map((key) => {
      let val = row[key];
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }
      // Escape double quotes and commas
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
