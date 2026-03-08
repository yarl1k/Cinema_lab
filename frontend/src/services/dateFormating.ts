export const formatTime = (isoString?: string | null) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('uk-UA', { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit' 
  });
};

export const formatToDDMMYYYY = (isoDateString?: string | null) => {
  if (!isoDateString) return '';
  const d = new Date(isoDateString);
  return isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

export const parseCustomDate = (dateStr: string) => {
  const parts = dateStr.split('.');
  return parts.length === 3 ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) : null;
};

export const parseTimeStrToMinutes = (timeStr: string) => {
  const parts = timeStr.split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
};

export const applyDateMask = (rawInput: string): string => {
  const val = rawInput.replace(/\D/g, '').substring(0, 8);
  if (val.length >= 5) return `${val.substring(0, 2)}.${val.substring(2, 4)}.${val.substring(4)}`;
  if (val.length >= 3) return `${val.substring(0, 2)}.${val.substring(2)}`;
  return val;
};