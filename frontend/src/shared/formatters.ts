export function formatWib(timestamp: string) {
  return `${new Intl.DateTimeFormat("en-GB", {
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
  if (differenceMinutes < 1) return "just now";
  if (differenceMinutes < 60) return `${differenceMinutes} ${differenceMinutes === 1 ? "minute" : "minutes"} ago`;
  const differenceHours = Math.round(differenceMinutes / 60);
  if (differenceHours < 24) return `${differenceHours} ${differenceHours === 1 ? "hour" : "hours"} ago`;
  const differenceDays = Math.round(differenceHours / 24);
  return `${differenceDays} ${differenceDays === 1 ? "day" : "days"} ago`;
}
