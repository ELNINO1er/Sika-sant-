import { apiGet } from './api.js';

let pollInterval = null;
let listeners = [];

export function onNotificationUpdate(callback) {
  listeners.push(callback);
  return () => { listeners = listeners.filter(fn => fn !== callback); };
}

function notify(data) {
  listeners.forEach(fn => {
    try { fn(data); } catch { /* ignore */ }
  });
}

async function fetchNotifications() {
  try {
    const [messagesRes, appointmentsRes] = await Promise.allSettled([
      apiGet('/patient/messages'),
      apiGet('/patient/appointments')
    ]);

    const unreadMessages = messagesRes.status === 'fulfilled'
      ? (messagesRes.value.data?.unreadCount || 0)
      : 0;

    const upcomingAppointments = appointmentsRes.status === 'fulfilled'
      ? (appointmentsRes.value.data?.upcoming?.length || 0)
      : 0;

    notify({
      unreadMessages,
      upcomingAppointments,
      total: unreadMessages + upcomingAppointments
    });
  } catch {
    // Silently fail — network may be down
  }
}

export function startPolling(intervalMs = 60000) {
  if (pollInterval) return;
  fetchNotifications();
  pollInterval = setInterval(fetchNotifications, intervalMs);
}

export function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
