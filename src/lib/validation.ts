import { AppError } from "./db";
import {
  bookingLeadError,
  isAtLeastHoursAhead,
  MIN_APPOINTMENT_LEAD_HOURS
} from "./appointment-rules";
import { DayOfWeek, Gender, Role } from "./types";

export const roles: Role[] = ["patient", "provider", "admin"];
export const genders: Gender[] = ["male", "female", "other"];
export const days: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${label} is required.`);
  }
  return value.trim();
}

export function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function intValue(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${label} must be a positive integer.`);
  }
  return parsed;
}

export function dateValue(value: unknown, label: string) {
  const text = requiredString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new AppError(`${label} must use YYYY-MM-DD format.`);
  }
  return text;
}

export function timeValue(value: unknown, label: string) {
  const text = requiredString(value, label);
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(text)) {
    throw new AppError(`${label} must use HH:MM format.`);
  }
  return text.slice(0, 5);
}

export function assertTimeOrder(startTime: string, endTime: string) {
  if (endTime <= startTime) {
    throw new AppError("End time must be after start time.");
  }
}

export function assertAppointmentLeadTime(
  appointmentDate: string,
  startTime: string,
  minimumHours = MIN_APPOINTMENT_LEAD_HOURS
) {
  if (!isAtLeastHoursAhead(appointmentDate, startTime, minimumHours)) {
    throw new AppError(bookingLeadError(minimumHours));
  }
}

export function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string
) {
  const text = requiredString(value, label) as T;
  if (!allowed.includes(text)) {
    throw new AppError(`${label} must be one of: ${allowed.join(", ")}.`);
  }
  return text;
}

export function dayNameFromDate(dateText: string) {
  const dayIndex = new Date(`${dateText}T00:00:00Z`).getUTCDay();
  return days[dayIndex === 0 ? 6 : dayIndex - 1];
}
