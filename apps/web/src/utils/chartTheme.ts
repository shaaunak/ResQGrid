/**
 * ResQGrid Palette & ECharts Theme Configurations
 * Strict Enterprise Palette:
 * - Navy Sequential Scale: #0F172A, #14284B, #1E3A8A, #2563EB, #3B82F6, #60A5FA, #93C5FD
 * - Severity Colors:
 *   Critical: #C8201B
 *   High: #E27D14
 *   Medium: #C9A100
 *   Low: #2E7D5B
 */

export const RESQ_PALETTE = {
  navyScale: ['#0F172A', '#14284B', '#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
  severity: {
    CRITICAL: '#C8201B',
    HIGH: '#E27D14',
    MEDIUM: '#C9A100',
    LOW: '#2E7D5B',
  },
  light: {
    bg: '#F6F4EF',
    surface: '#FFFFFF',
    surface2: '#FAF8F4',
    border: '#E3DFD6',
    ink: '#12161C',
    muted: '#5A6472',
    grid: '#EAE6DF',
  },
  dark: {
    bg: '#0C1118',
    surface: '#131A23',
    surface2: '#18212D',
    border: '#243040',
    ink: '#E8ECF2',
    muted: '#8A96A8',
    grid: '#1E293B',
  },
};

export const getSeverityColor = (sev: string): string => {
  const upper = (sev || '').toUpperCase();
  if (upper.includes('CRIT')) return RESQ_PALETTE.severity.CRITICAL;
  if (upper.includes('HIGH')) return RESQ_PALETTE.severity.HIGH;
  if (upper.includes('MED')) return RESQ_PALETTE.severity.MEDIUM;
  return RESQ_PALETTE.severity.LOW;
};

export const exportToCSV = (filename: string, rows: (string | number)[][], headers: string[]) => {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
