/** Date and time in Singapore time, whatever time zone the server runs in. */
export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Singapore" });
}
