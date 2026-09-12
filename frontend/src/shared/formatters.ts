export function formatWib(timestamp: string) {
  return `${new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    hour12: false,
  }).format(new Date(timestamp))} WIB`;
}

export function formatRelativeWib(timestamp: string) {
  const differenceMinutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000));
  if (differenceMinutes < 60) return `${differenceMinutes} menit lalu`;
  const differenceHours = Math.round(differenceMinutes / 60);
  if (differenceHours < 24) return `${differenceHours} jam lalu`;
  return `${Math.round(differenceHours / 24)} hari lalu`;
}
