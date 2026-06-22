// Helpers for <input type="datetime-local"> against timestamptz columns.
//
// A datetime-local value ("2026-07-11T20:00") is naive *local* time. Storing it
// raw makes Postgres read it as UTC, which shifts the displayed day in non-UTC
// timezones (e.g. an evening time in IST rolls to the next day). Convert to a
// real ISO instant on save, and back to local components when filling the input.

export function localInputToISO(s: string): string {
  if (!s) return s;
  const d = new Date(s); // datetime-local strings parse as local time
  return Number.isNaN(d.getTime()) ? s : d.toISOString();
}

export function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Current time as a datetime-local string in the user's local timezone.
export function nowLocalInput(): string {
  return isoToLocalInput(new Date().toISOString());
}
