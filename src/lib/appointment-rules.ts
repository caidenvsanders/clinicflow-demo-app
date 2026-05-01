export const MIN_APPOINTMENT_LEAD_HOURS = 24;

function normalizedTime(timeText: string) {
  return /^\d{2}:\d{2}:\d{2}$/.test(timeText) ? timeText.slice(0, 5) : timeText;
}

export function appointmentStartsAt(dateText: string, timeText: string) {
  return new Date(`${dateText}T${normalizedTime(timeText)}:00`);
}

export function isAtLeastHoursAhead(
  dateText: string,
  timeText: string,
  minimumHours: number,
  now = new Date()
) {
  const startsAt = appointmentStartsAt(dateText, timeText);
  if (Number.isNaN(startsAt.getTime())) {
    return false;
  }
  return startsAt.getTime() >= now.getTime() + minimumHours * 60 * 60 * 1000;
}

export function bookingLeadError(
  minimumHours = MIN_APPOINTMENT_LEAD_HOURS
) {
  return `Appointments must be scheduled at least ${minimumHours} hours in advance.`;
}

export function recommendedBookingDate(now = new Date()) {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return next.toISOString().slice(0, 10);
}
