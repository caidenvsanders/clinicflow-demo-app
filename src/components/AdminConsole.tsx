"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpDown,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  Filter,
  HeartPulse,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Shield,
  Stethoscope,
  Trash2,
  UserRound,
  Users,
  X
} from "lucide-react";
import type { ComponentPropsWithoutRef, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { recommendedBookingDate } from "@/lib/appointment-rules";
import type { SessionUser } from "@/lib/types";

type ApiResponse<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; details?: string };

type LookupRow = Record<string, string | number | null>;
type DbRow = Record<string, string | number | boolean | null>;
type ResourceKey =
  | "overview"
  | "patients"
  | "providers"
  | "appointments"
  | "departments"
  | "users"
  | "availability"
  | "activity";

type DatasetResponse = {
  rows: DbRow[];
  lookups: Record<string, LookupRow[]>;
};

type AdminDatasets = {
  users: DbRow[];
  patients: DbRow[];
  providers: DbRow[];
  appointments: DbRow[];
  departments: DbRow[];
  availability: DbRow[];
  auditLog: DbRow[];
  lookups: Record<string, LookupRow[]>;
};

type Notice = { type: "success" | "error"; text: string } | null;

type ModalState =
  | { kind: "user"; mode: "create" | "edit"; row?: DbRow | null }
  | { kind: "patient"; mode: "create" | "edit"; row?: DbRow | null }
  | { kind: "provider"; mode: "create" | "edit"; row?: DbRow | null }
  | { kind: "appointment"; mode: "create" | "edit"; row?: DbRow | null }
  | { kind: "department"; mode: "create" | "edit"; row?: DbRow | null }
  | { kind: "availability"; mode: "create" | "edit"; row?: DbRow | null }
  | null;

type ConfirmState = {
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => Promise<void>;
} | null;

type DetailState =
  | { kind: "patient"; row: DbRow }
  | { kind: "provider"; row: DbRow }
  | { kind: "appointment"; row: DbRow }
  | { kind: "user"; row: DbRow }
  | { kind: "department"; row: DbRow }
  | null;

type NavItem = {
  id: ResourceKey;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
};

const navItems: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Clinic summary and today’s operations"
  },
  {
    id: "patients",
    label: "Patients",
    icon: UserRound,
    description: "Profiles, visits, and contact details"
  },
  {
    id: "providers",
    label: "Providers",
    icon: Stethoscope,
    description: "Specialties, schedules, and availability"
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: CalendarClock,
    description: "Scheduling, status changes, and follow-up"
  },
  {
    id: "departments",
    label: "Departments",
    icon: DoorOpen,
    description: "Specialty areas and clinic contact lines"
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    description: "Account directory and role-linked records"
  },
  {
    id: "availability",
    label: "Availability",
    icon: Clock3,
    description: "Provider working windows and coverage"
  },
  {
    id: "activity",
    label: "Activity",
    icon: Activity,
    description: "Recent appointment audit history"
  }
];

const emptyDatasets: AdminDatasets = {
  users: [],
  patients: [],
  providers: [],
  appointments: [],
  departments: [],
  availability: [],
  auditLog: [],
  lookups: {}
};

const userDefaults = {
  first_name: "",
  last_name: "",
  email: "",
  password_hash: "",
  phone: "",
  role: "patient"
};

const patientDefaults = {
  first_name: "",
  last_name: "",
  email: "",
  password_hash: "",
  phone: "",
  date_of_birth: "",
  gender: "female",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  insurance_provider: "",
  insurance_policy_number: ""
};

const providerDefaults = {
  first_name: "",
  last_name: "",
  email: "",
  password_hash: "",
  phone: "",
  department_id: "",
  specialty: "",
  license_number: ""
};

const appointmentDefaults = {
  patient_id: "",
  provider_id: "",
  department_id: "",
  status_id: "",
  appointment_date: recommendedBookingDate(),
  start_time: "09:00",
  end_time: "09:30",
  reason: "",
  notes: ""
};

const departmentDefaults = {
  department_name: "",
  location: "",
  phone: ""
};

const availabilityDefaults = {
  provider_id: "",
  day_of_week: "Monday",
  start_time: "09:00",
  end_time: "17:00"
};

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

function fullName(row: DbRow | LookupRow | null | undefined) {
  return `${String(row?.first_name ?? "")} ${String(row?.last_name ?? "")}`.trim();
}

function lower(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function formatDate(value: unknown) {
  const text = String(value ?? "");
  if (!text) return "—";
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
}

function formatDateShort(value: unknown) {
  const text = String(value ?? "");
  if (!text) return "—";
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });
}

function parseNaiveDateTime(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (!match) return null;
  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    )
  );
}

function formatDateTime(value: unknown) {
  const text = String(value ?? "");
  if (!text) return "—";
  const date = parseNaiveDateTime(text) ?? new Date(text);
  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC"
      });
}

function formatTime(value: unknown) {
  const text = String(value ?? "");
  if (!text) return "—";
  const normalized = text.length === 5 ? `${text}:00` : text;
  const date = new Date(`1970-01-01T${normalized}`);
  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatPhone(value: unknown) {
  const text = String(value ?? "");
  return text || "—";
}

function toInputTime(value: unknown) {
  return String(value ?? "").slice(0, 5);
}

function isoToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function upcomingBoundary(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusTone(statusName: unknown) {
  const value = lower(statusName);
  if (value.includes("completed")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value.includes("cancel")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (value.includes("confirm")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (value.includes("pending")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function lookupLabel(
  rows: LookupRow[] | undefined,
  key: string,
  labelBuilder: (row: LookupRow) => string
) {
  return rows?.map((row) => ({
    value: String(row[key] ?? ""),
    label: labelBuilder(row)
  })) ?? [];
}

export function AdminConsole({
  session,
  onLogout
}: {
  session: SessionUser;
  onLogout?: () => void;
}) {
  const [activeSection, setActiveSection] = useState<ResourceKey>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<AdminDatasets>(emptyDatasets);
  const [modal, setModal] = useState<ModalState>(null);
  const [detail, setDetail] = useState<DetailState>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [providerDepartment, setProviderDepartment] = useState("all");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentStatus, setAppointmentStatus] = useState("all");
  const [appointmentProvider, setAppointmentProvider] = useState("all");
  const [appointmentRange, setAppointmentRange] = useState("all");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");
  const [availabilityProvider, setAvailabilityProvider] = useState("all");
  const [availabilitySearch, setAvailabilitySearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [patientSort, setPatientSort] = useState("name");
  const [providerSort, setProviderSort] = useState("name");
  const [appointmentSort, setAppointmentSort] = useState("date-asc");

  const api = useCallback(async <T,>(url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });
    const payload = (await response.json()) as ApiResponse<T>;
    if (!payload.ok) {
      throw new Error([payload.error, payload.details].filter(Boolean).join(" "));
    }
    return payload;
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [users, patients, providers, appointments, departments, availability, auditLog] =
        await Promise.all([
          api<DatasetResponse>("/api/users"),
          api<DatasetResponse>("/api/patients"),
          api<DatasetResponse>("/api/providers"),
          api<DatasetResponse>("/api/appointments"),
          api<DatasetResponse>("/api/departments"),
          api<DatasetResponse>("/api/availability"),
          api<DatasetResponse>("/api/audit-log")
        ]);

      setDatasets({
        users: users.data.rows,
        patients: patients.data.rows,
        providers: providers.data.rows,
        appointments: appointments.data.rows,
        departments: departments.data.rows,
        availability: availability.data.rows,
        auditLog: auditLog.data.rows,
        lookups: appointments.data.lookups
      });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const usersById = useMemo(() => {
    const map = new Map<number, DbRow>();
    for (const row of datasets.users) {
      map.set(Number(row.user_id), row);
    }
    return map;
  }, [datasets.users]);

  const providersById = useMemo(() => {
    const map = new Map<number, DbRow>();
    for (const row of datasets.providers) {
      map.set(Number(row.provider_id), row);
    }
    return map;
  }, [datasets.providers]);

  const patientsById = useMemo(() => {
    const map = new Map<number, DbRow>();
    for (const row of datasets.patients) {
      map.set(Number(row.patient_id), row);
    }
    return map;
  }, [datasets.patients]);

  const today = isoToday();
  const upcomingCutoff = upcomingBoundary(21);

  const appointmentMetrics = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let cancelledCount = 0;
    let pendingCount = 0;

    for (const row of datasets.appointments) {
      const date = String(row.appointment_date ?? "");
      const status = lower(row.status_name);
      if (date === today) todayCount += 1;
      if (date >= today && date <= upcomingCutoff) upcomingCount += 1;
      if (status.includes("cancel")) cancelledCount += 1;
      if (status.includes("pending")) pendingCount += 1;
    }

    return { todayCount, upcomingCount, cancelledCount, pendingCount };
  }, [datasets.appointments, today, upcomingCutoff]);

  const todaySchedule = useMemo(() => {
    return [...datasets.appointments]
      .filter((row) => String(row.appointment_date ?? "") === today)
      .sort((left, right) => {
        const a = String(left.start_time ?? "");
        const b = String(right.start_time ?? "");
        return a.localeCompare(b);
      })
      .slice(0, 8);
  }, [datasets.appointments, today]);

  const upcomingAppointments = useMemo(() => {
    return [...datasets.appointments]
      .filter((row) => String(row.appointment_date ?? "") >= today)
      .sort((left, right) => {
        const dateCompare = String(left.appointment_date ?? "").localeCompare(
          String(right.appointment_date ?? "")
        );
        if (dateCompare !== 0) return dateCompare;
        return String(left.start_time ?? "").localeCompare(String(right.start_time ?? ""));
      })
      .slice(0, 10);
  }, [datasets.appointments, today]);

  const recentActivity = useMemo(() => datasets.auditLog.slice(0, 8), [datasets.auditLog]);

  const enrichedPatients = useMemo(() => {
    return datasets.patients.map((patient) => {
      const user = usersById.get(Number(patient.user_id));
      const patientAppointments = datasets.appointments.filter(
        (appointment) => Number(appointment.patient_id) === Number(patient.patient_id)
      );
      const upcoming = patientAppointments.filter(
        (appointment) =>
          String(appointment.appointment_date ?? "") >= today &&
          !lower(appointment.status_name).includes("cancel")
      ).length;
      const lastAppointment = [...patientAppointments]
        .sort((left, right) =>
          String(right.appointment_date ?? "").localeCompare(String(left.appointment_date ?? ""))
        )
        .at(0);

      return {
        ...patient,
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        full_name: fullName(user ?? patient),
        insurance_provider: patient.insurance_provider ?? "",
        upcoming_count: upcoming,
        last_appointment: lastAppointment?.appointment_date ?? null
      };
    });
  }, [datasets.appointments, datasets.patients, today, usersById]);

  const enrichedProviders = useMemo(() => {
    return datasets.providers.map((provider) => {
      const user = usersById.get(Number(provider.user_id));
      const providerAppointments = datasets.appointments.filter(
        (appointment) => Number(appointment.provider_id) === Number(provider.provider_id)
      );
      const todayTotal = providerAppointments.filter(
        (appointment) => String(appointment.appointment_date ?? "") === today
      ).length;
      const upcomingTotal = providerAppointments.filter(
        (appointment) =>
          String(appointment.appointment_date ?? "") >= today &&
          !lower(appointment.status_name).includes("cancel")
      ).length;

      return {
        ...provider,
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        full_name: fullName(user ?? provider),
        department_id: provider.department_id ?? "",
        department_name: provider.department_name ?? "",
        specialty: provider.specialty ?? "",
        appointments_today: todayTotal,
        upcoming_count: upcomingTotal
      };
    });
  }, [datasets.appointments, datasets.providers, today, usersById]);

  const availabilityByProvider = useMemo(() => {
    const map = new Map<number, DbRow[]>();
    for (const row of datasets.availability) {
      const id = Number(row.provider_id);
      const existing = map.get(id) ?? [];
      existing.push(row);
      map.set(id, existing);
    }
    return map;
  }, [datasets.availability]);

  const filteredPatients = useMemo(() => {
    const query = lower(patientSearch);
    const sorted = [...enrichedPatients].filter((patient) => {
      const haystack = [
        patient.full_name,
        patient.email,
        patient.phone,
        patient["insurance_provider"]
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    sorted.sort((left, right) => {
      if (patientSort === "upcoming") {
        return Number(right.upcoming_count) - Number(left.upcoming_count);
      }
      if (patientSort === "recent") {
        return String(right.last_appointment ?? "").localeCompare(String(left.last_appointment ?? ""));
      }
      return String(left.full_name).localeCompare(String(right.full_name));
    });

    return sorted;
  }, [enrichedPatients, patientSearch, patientSort]);

  const filteredProviders = useMemo(() => {
    const query = lower(providerSearch);
    const sorted = [...enrichedProviders].filter((provider) => {
      const matchesDepartment =
        providerDepartment === "all" ||
        String(provider.department_id ?? "") === providerDepartment;
      const haystack = [
        provider.full_name,
        provider.email,
        provider.phone,
        provider.specialty,
        provider.department_name
      ]
        .join(" ")
        .toLowerCase();
      return matchesDepartment && haystack.includes(query);
    });

    sorted.sort((left, right) => {
      if (providerSort === "schedule") {
        return Number(right.upcoming_count) - Number(left.upcoming_count);
      }
      if (providerSort === "specialty") {
        return String(left.specialty ?? "").localeCompare(String(right.specialty ?? ""));
      }
      return String(left.full_name).localeCompare(String(right.full_name));
    });

    return sorted;
  }, [enrichedProviders, providerDepartment, providerSearch, providerSort]);

  const filteredAppointments = useMemo(() => {
    const query = lower(appointmentSearch);
    const filtered = [...datasets.appointments].filter((appointment) => {
      const statusMatches =
        appointmentStatus === "all" || String(appointment.status_id ?? "") === appointmentStatus;
      const providerMatches =
        appointmentProvider === "all" ||
        String(appointment.provider_id ?? "") === appointmentProvider;
      const date = String(appointment.appointment_date ?? "");
      const rangeMatches =
        appointmentRange === "all" ||
        (appointmentRange === "today" && date === today) ||
        (appointmentRange === "upcoming" && date >= today) ||
        (appointmentRange === "past" && date < today);

      const haystack = [
        appointment.patient_first,
        appointment.patient_last,
        appointment.provider_first,
        appointment.provider_last,
        appointment.reason,
        appointment.department_name,
        appointment.status_name
      ]
        .join(" ")
        .toLowerCase();

      return statusMatches && providerMatches && rangeMatches && haystack.includes(query);
    });

    filtered.sort((left, right) => {
      if (appointmentSort === "date-desc") {
        const dateCompare = String(right.appointment_date ?? "").localeCompare(
          String(left.appointment_date ?? "")
        );
        if (dateCompare !== 0) return dateCompare;
        return String(right.start_time ?? "").localeCompare(String(left.start_time ?? ""));
      }
      if (appointmentSort === "status") {
        return String(left.status_name ?? "").localeCompare(String(right.status_name ?? ""));
      }
      const dateCompare = String(left.appointment_date ?? "").localeCompare(
        String(right.appointment_date ?? "")
      );
      if (dateCompare !== 0) return dateCompare;
      return String(left.start_time ?? "").localeCompare(String(right.start_time ?? ""));
    });

    return filtered;
  }, [
    appointmentProvider,
    appointmentRange,
    appointmentSearch,
    appointmentSort,
    appointmentStatus,
    datasets.appointments,
    today
  ]);

  const filteredDepartments = useMemo(() => {
    const query = lower(departmentSearch);
    return datasets.departments.filter((department) =>
      [department.department_name, department.location, department.phone]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [datasets.departments, departmentSearch]);

  const filteredUsers = useMemo(() => {
    const query = lower(userSearch);
    return datasets.users.filter((user) => {
      const matchesRole = userRole === "all" || String(user.role ?? "") === userRole;
      const haystack = [user.first_name, user.last_name, user.email, user.phone, user.role]
        .join(" ")
        .toLowerCase();
      return matchesRole && haystack.includes(query);
    });
  }, [datasets.users, userRole, userSearch]);

  const filteredAvailability = useMemo(() => {
    const query = lower(availabilitySearch);
    return datasets.availability.filter((slot) => {
      const matchesProvider =
        availabilityProvider === "all" ||
        String(slot.provider_id ?? "") === availabilityProvider;
      const haystack = [slot.first_name, slot.last_name, slot.day_of_week, slot.start_time, slot.end_time]
        .join(" ")
        .toLowerCase();
      return matchesProvider && haystack.includes(query);
    });
  }, [availabilityProvider, availabilitySearch, datasets.availability]);

  const filteredActivity = useMemo(() => {
    const query = lower(activitySearch);
    return datasets.auditLog.filter((entry) =>
      [
        entry.change_reason,
        entry.changed_by_first,
        entry.changed_by_last,
        entry.old_status,
        entry.new_status
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [activitySearch, datasets.auditLog]);

  const departmentOptions = useMemo(
    () =>
      lookupLabel(datasets.lookups.departments, "department_id", (row) =>
        String(row.department_name ?? `Department ${row.department_id ?? ""}`)
      ),
    [datasets.lookups.departments]
  );

  const statusOptions = useMemo(
    () =>
      lookupLabel(datasets.lookups.statuses, "status_id", (row) => String(row.status_name ?? "")),
    [datasets.lookups.statuses]
  );

  const providerOptions = useMemo(
    () =>
      lookupLabel(datasets.lookups.providers, "provider_id", (row) =>
        `${fullName(row)}${row.department_id ? ` • ${departmentNameFromId(Number(row.department_id), datasets.departments)}` : ""}`
      ),
    [datasets.departments, datasets.lookups.providers]
  );

  const patientOptions = useMemo(
    () =>
      lookupLabel(datasets.lookups.patients, "patient_id", (row) => fullName(row) || `Patient ${row.patient_id}`),
    [datasets.lookups.patients]
  );

  const availablePatientUsers = useMemo(() => {
    const linked = new Set(datasets.patients.map((row) => Number(row.user_id)));
    return datasets.users.filter((user) => user.role === "patient" && !linked.has(Number(user.user_id)));
  }, [datasets.patients, datasets.users]);

  const availableProviderUsers = useMemo(() => {
    const linked = new Set(datasets.providers.map((row) => Number(row.user_id)));
    return datasets.users.filter((user) => user.role === "provider" && !linked.has(Number(user.user_id)));
  }, [datasets.providers, datasets.users]);

  async function performMutation<T>(
    operation: () => Promise<T>,
    successMessage: string,
    keepModalOpen = false
  ) {
    setMutating(true);
    setModalError(null);
    try {
      await operation();
      await refreshAll();
      setNotice({ type: "success", text: successMessage });
      setModalError(null);
      if (!keepModalOpen) {
        setModal(null);
        setDetail(null);
      }
    } catch (error) {
      const message = errorMessage(error);
      if (!modal) {
        setNotice({ type: "error", text: message });
      }
      setModalError(message);
    } finally {
      setMutating(false);
    }
  }

  function openPatientModal(mode: "create" | "edit", row?: DbRow) {
    setModalError(null);
    setModal({ kind: "patient", mode, row: row ?? null });
  }

  function openProviderModal(mode: "create" | "edit", row?: DbRow) {
    setModalError(null);
    setModal({ kind: "provider", mode, row: row ?? null });
  }

  function openUserModal(mode: "create" | "edit", row?: DbRow) {
    setModalError(null);
    setModal({ kind: "user", mode, row: row ?? null });
  }

  function openAppointmentModal(mode: "create" | "edit", row?: DbRow) {
    setModalError(null);
    setModal({ kind: "appointment", mode, row: row ?? null });
  }

  function openDepartmentModal(mode: "create" | "edit", row?: DbRow) {
    setModalError(null);
    setModal({ kind: "department", mode, row: row ?? null });
  }

  function openAvailabilityModal(mode: "create" | "edit", row?: DbRow) {
    setModalError(null);
    setModal({ kind: "availability", mode, row: row ?? null });
  }

  function askDeleteUser(row: DbRow) {
    const isSelf = Number(row.user_id) === session.userId;
    if (isSelf) {
      setNotice({
        type: "error",
        text: "For safety, you can’t delete the admin account that is currently signed in."
      });
      return;
    }

    setConfirmState({
      title: "Delete user account?",
      body:
        "This removes the account record. If it is linked to a patient or provider profile, related records may also be affected by database rules.",
      confirmLabel: "Delete user",
      tone: "danger",
      onConfirm: async () => {
        await performMutation(
          () => api(`/api/users?id=${Number(row.user_id)}`, { method: "DELETE" }),
          "User deleted."
        );
      }
    });
  }

  function askDeletePatient(row: DbRow) {
    setConfirmState({
      title: "Delete patient record?",
      body:
        "This removes the patient’s linked user account and any appointments that cascade from that relationship. Use this only when the record should fully leave the local demo system.",
      confirmLabel: "Delete patient",
      tone: "danger",
      onConfirm: async () => {
        await performMutation(
          () => api(`/api/users?id=${Number(row.user_id)}`, { method: "DELETE" }),
          "Patient deleted."
        );
      }
    });
  }

  function askDeleteProvider(row: DbRow) {
    setConfirmState({
      title: "Delete provider record?",
      body:
        "This removes the provider’s linked user account. If appointments still depend on this provider, the database will block the deletion and we’ll keep the schedule intact.",
      confirmLabel: "Delete provider",
      tone: "danger",
      onConfirm: async () => {
        await performMutation(
          () => api(`/api/users?id=${Number(row.user_id)}`, { method: "DELETE" }),
          "Provider deleted."
        );
      }
    });
  }

  function askDeleteAppointment(row: DbRow) {
    setConfirmState({
      title: "Delete appointment?",
      body: "This permanently removes the appointment record from the local demo database.",
      confirmLabel: "Delete appointment",
      tone: "danger",
      onConfirm: async () => {
        await performMutation(
          () => api(`/api/appointments?id=${Number(row.appointment_id)}`, { method: "DELETE" }),
          "Appointment deleted."
        );
      }
    });
  }

  function askDeleteDepartment(row: DbRow) {
    setConfirmState({
      title: "Delete department?",
      body:
        "If providers or appointments still reference this department, the database will block the deletion and keep those records safe.",
      confirmLabel: "Delete department",
      tone: "danger",
      onConfirm: async () => {
        await performMutation(
          () => api(`/api/departments?id=${Number(row.department_id)}`, { method: "DELETE" }),
          "Department deleted."
        );
      }
    });
  }

  function askDeleteAvailability(row: DbRow) {
    setConfirmState({
      title: "Delete availability window?",
      body: "This removes the selected provider availability slot from the schedule.",
      confirmLabel: "Delete slot",
      tone: "danger",
      onConfirm: async () => {
        await performMutation(
          () => api(`/api/availability?id=${Number(row.availability_id)}`, { method: "DELETE" }),
          "Availability slot deleted."
        );
      }
    });
  }

  const activeNav = navItems.find((item) => item.id === activeSection) ?? navItems[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white xl:block">
          <div className="xl:sticky xl:top-0 xl:flex xl:h-screen xl:flex-col">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-clinic-sky text-blue-700">
                  <HeartPulse size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">ClinicFlow</p>
                  <p className="text-xs text-slate-500">Clinic operations console</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Admin navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeSection;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      active
                        ? "bg-blue-50 text-blue-900 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-10 w-10 place-items-center rounded-xl ${
                        active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 px-4 py-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Signed in
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {session.firstName} {session.lastName}
                </p>
                <p className="mt-1 text-sm text-slate-500">{session.email}</p>
                <div className="mt-4 flex gap-2">
                  <Link href="/" className="ghost-button flex-1 justify-center">
                    Back home
                  </Link>
                  {onLogout && (
                    <button type="button" className="ghost-button flex-1 justify-center" onClick={onLogout}>
                      <LogOut size={16} />
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="icon-button xl:hidden"
                  aria-label={mobileNavOpen ? "Close admin navigation" : "Open admin navigation"}
                  aria-expanded={mobileNavOpen}
                  onClick={() => setMobileNavOpen((value) => !value)}
                >
                  {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Admin view
                  </p>
                  <h1 className="truncate text-2xl font-semibold tracking-normal text-slate-950">
                    {activeSection === "overview" ? "Clinic operations" : activeNav.label}
                  </h1>
                  <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                    {activeSection === "overview"
                      ? "Manage patients, providers, appointments, and clinic data from one secure workspace."
                      : activeNav.description}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button type="button" className="ghost-button" onClick={() => void refreshAll()}>
                  <RefreshCcw size={16} />
                  Refresh
                </button>
                {onLogout && (
                  <button type="button" className="ghost-button hidden sm:inline-flex" onClick={onLogout}>
                    <LogOut size={16} />
                    Sign out
                  </button>
                )}
              </div>
            </div>

            {mobileNavOpen && (
              <div className="border-t border-slate-200 bg-white xl:hidden">
                <nav className="mx-auto grid max-w-[1600px] gap-2 px-4 py-4 sm:px-6 lg:px-8" aria-label="Mobile admin navigation">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === activeSection;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left ${
                          active ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 place-items-center rounded-xl ${
                            active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{item.label}</span>
                          <span className="block truncate text-xs text-slate-500">{item.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </header>

          <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {notice && (
              <div
                className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                  notice.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-900"
                }`}
              >
                {notice.text}
              </div>
            )}

            {loading ? (
              <div className="grid flex-1 place-items-center rounded-3xl border border-slate-200 bg-white px-6 py-20 shadow-soft">
                <div className="flex flex-col items-center gap-3 text-center text-slate-500">
                  <Loader2 className="animate-spin text-blue-700" size={26} />
                  <div>
                    <p className="text-base font-semibold text-slate-900">Loading clinic data</p>
                    <p className="mt-1 text-sm">Pulling patients, providers, appointments, and schedule activity.</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {activeSection === "overview" && (
                  <OverviewSection
                    session={session}
                    datasets={datasets}
                    metrics={appointmentMetrics}
                    todaySchedule={todaySchedule}
                    recentActivity={recentActivity}
                    onQuickAction={(action) => {
                      if (action === "patient") {
                        setActiveSection("patients");
                        openPatientModal("create");
                      }
                      if (action === "provider") {
                        setActiveSection("providers");
                        openProviderModal("create");
                      }
                      if (action === "appointment") {
                        setActiveSection("appointments");
                        openAppointmentModal("create");
                      }
                      if (action === "appointments") {
                        setActiveSection("appointments");
                      }
                    }}
                  />
                )}

                {activeSection === "patients" && (
                  <section className="space-y-5">
                    <SectionIntro
                      title="Patients"
                      description="Review patient profiles, upcoming visits, and contact details from one place."
                      action={
                        <button type="button" className="primary-button" onClick={() => openPatientModal("create")}>
                          <Plus size={16} />
                          Add patient
                        </button>
                      }
                    />
                    <Toolbar>
                      <SearchField
                        label="Search patients"
                        value={patientSearch}
                        onChange={setPatientSearch}
                        placeholder="Search by name, email, phone, or insurer"
                      />
                      <SelectField
                        label="Sort"
                        value={patientSort}
                        onChange={setPatientSort}
                        options={[
                          { value: "name", label: "Name" },
                          { value: "upcoming", label: "Upcoming appointments" },
                          { value: "recent", label: "Last appointment" }
                        ]}
                      />
                    </Toolbar>
                    <ResponsiveTable
                      rows={filteredPatients}
                      emptyTitle="No patients match this search"
                      emptyBody="Try a broader search or add a new patient profile."
                      columns={[
                        { label: "Patient", render: (row) => <PrimaryCell title={String(row.full_name)} subtitle={String(row.email || "No email")} /> },
                        { label: "Phone", render: (row) => formatPhone(row.phone) },
                        { label: "Date of birth", render: (row) => formatDate(row.date_of_birth) },
                        { label: "Upcoming", render: (row) => <CountBadge value={Number(row.upcoming_count ?? 0)} label="visits" /> },
                        { label: "Last appointment", render: (row) => formatDate(row.last_appointment) },
                        {
                          label: "Actions",
                          align: "right",
                          render: (row) => (
                            <RowActions
                              onView={() => setDetail({ kind: "patient", row })}
                              onEdit={() => openPatientModal("edit", row)}
                              onDelete={() => askDeletePatient(row)}
                            />
                          )
                        }
                      ]}
                      mobileCard={(row) => (
                        <EntityCard
                          title={String(row.full_name)}
                          subtitle={String(row.email || "No email")}
                          meta={[
                            ["Phone", formatPhone(row.phone)],
                            ["DOB", formatDate(row.date_of_birth)],
                            ["Upcoming", `${Number(row.upcoming_count ?? 0)} visits`],
                            ["Last appointment", formatDate(row.last_appointment)]
                          ]}
                          actions={
                            <RowActions
                              stacked
                              onView={() => setDetail({ kind: "patient", row })}
                              onEdit={() => openPatientModal("edit", row)}
                              onDelete={() => askDeletePatient(row)}
                            />
                          }
                        />
                      )}
                    />
                  </section>
                )}

                {activeSection === "providers" && (
                  <section className="space-y-5">
                    <SectionIntro
                      title="Providers"
                      description="Manage provider profiles, specialties, and forward-looking schedule capacity."
                      action={
                        <button type="button" className="primary-button" onClick={() => openProviderModal("create")}>
                          <Plus size={16} />
                          Add provider
                        </button>
                      }
                    />
                    <Toolbar>
                      <SearchField
                        label="Search providers"
                        value={providerSearch}
                        onChange={setProviderSearch}
                        placeholder="Search by name, specialty, email, or phone"
                      />
                      <SelectField
                        label="Department"
                        value={providerDepartment}
                        onChange={setProviderDepartment}
                        options={[{ value: "all", label: "All departments" }, ...departmentOptions]}
                      />
                      <SelectField
                        label="Sort"
                        value={providerSort}
                        onChange={setProviderSort}
                        options={[
                          { value: "name", label: "Name" },
                          { value: "specialty", label: "Specialty" },
                          { value: "schedule", label: "Upcoming appointments" }
                        ]}
                      />
                    </Toolbar>
                    <ResponsiveTable
                      rows={filteredProviders}
                      emptyTitle="No providers match this view"
                      emptyBody="Try another search or filter, or create a provider account."
                      columns={[
                        {
                          label: "Provider",
                          render: (row) => (
                            <PrimaryCell
                              title={String(row.full_name)}
                              subtitle={`${String(row.specialty ?? "Specialty not set")} • ${String(
                                row.department_name ?? ""
                              )}`}
                            />
                          )
                        },
                        { label: "Email", render: (row) => String(row.email || "—") },
                        { label: "Phone", render: (row) => formatPhone(row.phone) },
                        { label: "Today", render: (row) => <CountBadge value={Number(row.appointments_today ?? 0)} label="visits" /> },
                        { label: "Upcoming", render: (row) => <CountBadge value={Number(row.upcoming_count ?? 0)} label="scheduled" /> },
                        {
                          label: "Actions",
                          align: "right",
                          render: (row) => (
                            <RowActions
                              onView={() => setDetail({ kind: "provider", row })}
                              onEdit={() => openProviderModal("edit", row)}
                              onDelete={() => askDeleteProvider(row)}
                            />
                          )
                        }
                      ]}
                      mobileCard={(row) => (
                        <EntityCard
                          title={String(row.full_name)}
                          subtitle={`${String(row.specialty ?? "")} • ${String(row.department_name ?? "")}`}
                          meta={[
                            ["Email", String(row.email || "—")],
                            ["Phone", formatPhone(row.phone)],
                            ["Today", `${Number(row.appointments_today ?? 0)} visits`],
                            ["Upcoming", `${Number(row.upcoming_count ?? 0)} scheduled`]
                          ]}
                          actions={
                            <RowActions
                              stacked
                              onView={() => setDetail({ kind: "provider", row })}
                              onEdit={() => openProviderModal("edit", row)}
                              onDelete={() => askDeleteProvider(row)}
                            />
                          }
                        />
                      )}
                    />
                  </section>
                )}

                {activeSection === "appointments" && (
                  <section className="space-y-5">
                    <SectionIntro
                      title="Appointments"
                      description="Schedule, update, and monitor visits across the clinic calendar."
                      action={
                        <button type="button" className="primary-button" onClick={() => openAppointmentModal("create")}>
                          <Plus size={16} />
                          Schedule appointment
                        </button>
                      }
                    />
                    <Toolbar>
                      <SearchField
                        label="Search appointments"
                        value={appointmentSearch}
                        onChange={setAppointmentSearch}
                        placeholder="Search by patient, provider, reason, or department"
                      />
                      <SelectField
                        label="Status"
                        value={appointmentStatus}
                        onChange={setAppointmentStatus}
                        options={[{ value: "all", label: "All statuses" }, ...statusOptions]}
                      />
                      <SelectField
                        label="Provider"
                        value={appointmentProvider}
                        onChange={setAppointmentProvider}
                        options={[{ value: "all", label: "All providers" }, ...providerOptions]}
                      />
                      <SelectField
                        label="Date range"
                        value={appointmentRange}
                        onChange={setAppointmentRange}
                        options={[
                          { value: "all", label: "All dates" },
                          { value: "today", label: "Today" },
                          { value: "upcoming", label: "Upcoming" },
                          { value: "past", label: "Past" }
                        ]}
                      />
                      <SelectField
                        label="Sort"
                        value={appointmentSort}
                        onChange={setAppointmentSort}
                        options={[
                          { value: "date-asc", label: "Soonest first" },
                          { value: "date-desc", label: "Newest first" },
                          { value: "status", label: "Status" }
                        ]}
                      />
                    </Toolbar>
                    <ResponsiveTable
                      rows={filteredAppointments}
                      emptyTitle="No appointments match this view"
                      emptyBody="Adjust the filters or schedule a new appointment."
                      columns={[
                        {
                          label: "Visit",
                          render: (row) => (
                            <PrimaryCell
                              title={`${formatDateShort(row.appointment_date)} • ${formatTime(row.start_time)}`}
                              subtitle={String(row.reason || "General appointment")}
                            />
                          )
                        },
                        { label: "Patient", render: (row) => `${String(row.patient_first ?? "")} ${String(row.patient_last ?? "")}`.trim() || "—" },
                        { label: "Provider", render: (row) => `${String(row.provider_first ?? "")} ${String(row.provider_last ?? "")}`.trim() || "—" },
                        { label: "Department", render: (row) => String(row.department_name || "—") },
                        {
                          label: "Status",
                          render: (row) => (
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(row.status_name)}`}>
                              {String(row.status_name || "Unknown")}
                            </span>
                          )
                        },
                        {
                          label: "Actions",
                          align: "right",
                          render: (row) => (
                            <RowActions
                              onView={() => setDetail({ kind: "appointment", row })}
                              onEdit={() => openAppointmentModal("edit", row)}
                              onDelete={() => askDeleteAppointment(row)}
                            />
                          )
                        }
                      ]}
                      mobileCard={(row) => (
                        <EntityCard
                          title={`${formatDate(row.appointment_date)} • ${formatTime(row.start_time)}`}
                          subtitle={`${String(row.patient_first ?? "")} ${String(row.patient_last ?? "")}`.trim()}
                          meta={[
                            ["Provider", `${String(row.provider_first ?? "")} ${String(row.provider_last ?? "")}`.trim()],
                            ["Department", String(row.department_name || "—")],
                            ["Reason", String(row.reason || "General appointment")],
                            ["Status", String(row.status_name || "—")]
                          ]}
                          actions={
                            <RowActions
                              stacked
                              onView={() => setDetail({ kind: "appointment", row })}
                              onEdit={() => openAppointmentModal("edit", row)}
                              onDelete={() => askDeleteAppointment(row)}
                            />
                          }
                        />
                      )}
                    />
                  </section>
                )}

                {activeSection === "departments" && (
                  <section className="space-y-5">
                    <SectionIntro
                      title="Departments"
                      description="Keep specialty areas, clinic locations, and contact lines up to date."
                      action={
                        <button type="button" className="primary-button" onClick={() => openDepartmentModal("create")}>
                          <Plus size={16} />
                          Add department
                        </button>
                      }
                    />
                    <Toolbar>
                      <SearchField
                        label="Search departments"
                        value={departmentSearch}
                        onChange={setDepartmentSearch}
                        placeholder="Search by department, location, or phone"
                      />
                    </Toolbar>
                    <ResponsiveTable
                      rows={filteredDepartments}
                      emptyTitle="No departments match this search"
                      emptyBody="Adjust the search or add a new department."
                      columns={[
                        {
                          label: "Department",
                          render: (row) => (
                            <PrimaryCell title={String(row.department_name || "Unnamed department")} subtitle={String(row.location || "Location not set")} />
                          )
                        },
                        { label: "Phone", render: (row) => formatPhone(row.phone) },
                        { label: "Providers", render: (row) => <CountBadge value={Number(row.providers ?? 0)} label="providers" /> },
                        { label: "Appointments", render: (row) => <CountBadge value={Number(row.appointments ?? 0)} label="appointments" /> },
                        {
                          label: "Actions",
                          align: "right",
                          render: (row) => (
                            <RowActions
                              onView={() => setDetail({ kind: "department", row })}
                              onEdit={() => openDepartmentModal("edit", row)}
                              onDelete={() => askDeleteDepartment(row)}
                            />
                          )
                        }
                      ]}
                      mobileCard={(row) => (
                        <EntityCard
                          title={String(row.department_name || "Unnamed department")}
                          subtitle={String(row.location || "Location not set")}
                          meta={[
                            ["Phone", formatPhone(row.phone)],
                            ["Providers", `${Number(row.providers ?? 0)} providers`],
                            ["Appointments", `${Number(row.appointments ?? 0)} appointments`]
                          ]}
                          actions={
                            <RowActions
                              stacked
                              onView={() => setDetail({ kind: "department", row })}
                              onEdit={() => openDepartmentModal("edit", row)}
                              onDelete={() => askDeleteDepartment(row)}
                            />
                          }
                        />
                      )}
                    />
                  </section>
                )}

                {activeSection === "users" && (
                  <section className="space-y-5">
                    <SectionIntro
                      title="Users"
                      description="Review account records, contact details, and linked clinic roles."
                      action={
                        <button type="button" className="primary-button" onClick={() => openUserModal("create")}>
                          <Plus size={16} />
                          Add user
                        </button>
                      }
                    />
                    <Toolbar>
                      <SearchField
                        label="Search users"
                        value={userSearch}
                        onChange={setUserSearch}
                        placeholder="Search by name, email, phone, or role"
                      />
                      <SelectField
                        label="Role"
                        value={userRole}
                        onChange={setUserRole}
                        options={[
                          { value: "all", label: "All roles" },
                          { value: "patient", label: "Patient" },
                          { value: "provider", label: "Provider" },
                          { value: "admin", label: "Admin" }
                        ]}
                      />
                    </Toolbar>
                    <ResponsiveTable
                      rows={filteredUsers}
                      emptyTitle="No users match this view"
                      emptyBody="Try another search or create a new account."
                      columns={[
                        {
                          label: "User",
                          render: (row) => (
                            <PrimaryCell
                              title={fullName(row)}
                              subtitle={String(row.email || "No email")}
                            />
                          )
                        },
                        { label: "Phone", render: (row) => formatPhone(row.phone) },
                        {
                          label: "Role",
                          render: (row) => (
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                              {String(row.role || "user")}
                            </span>
                          )
                        },
                        {
                          label: "Linked profile",
                          render: (row) => linkedProfileLabel(row, datasets)
                        },
                        { label: "Created", render: (row) => formatDateTime(row.created_at) },
                        {
                          label: "Actions",
                          align: "right",
                          render: (row) => (
                            <RowActions
                              onView={() => setDetail({ kind: "user", row })}
                              onEdit={() => openUserModal("edit", row)}
                              onDelete={() => askDeleteUser(row)}
                            />
                          )
                        }
                      ]}
                      mobileCard={(row) => (
                        <EntityCard
                          title={fullName(row)}
                          subtitle={String(row.email || "No email")}
                          meta={[
                            ["Phone", formatPhone(row.phone)],
                            ["Role", String(row.role || "user")],
                            ["Linked profile", linkedProfileLabel(row, datasets)],
                            ["Created", formatDateTime(row.created_at)]
                          ]}
                          actions={
                            <RowActions
                              stacked
                              onView={() => setDetail({ kind: "user", row })}
                              onEdit={() => openUserModal("edit", row)}
                              onDelete={() => askDeleteUser(row)}
                            />
                          }
                        />
                      )}
                    />
                  </section>
                )}

                {activeSection === "availability" && (
                  <section className="space-y-5">
                    <SectionIntro
                      title="Availability"
                      description="Maintain provider schedule windows and keep appointment booking aligned with real coverage."
                      action={
                        <button type="button" className="primary-button" onClick={() => openAvailabilityModal("create")}>
                          <Plus size={16} />
                          Add availability
                        </button>
                      }
                    />
                    <Toolbar>
                      <SearchField
                        label="Search availability"
                        value={availabilitySearch}
                        onChange={setAvailabilitySearch}
                        placeholder="Search by provider or weekday"
                      />
                      <SelectField
                        label="Provider"
                        value={availabilityProvider}
                        onChange={setAvailabilityProvider}
                        options={[{ value: "all", label: "All providers" }, ...providerOptions]}
                      />
                    </Toolbar>
                    <ResponsiveTable
                      rows={filteredAvailability}
                      emptyTitle="No availability windows match this view"
                      emptyBody="Adjust the filters or create a new provider schedule window."
                      columns={[
                        {
                          label: "Provider",
                          render: (row) => (
                            <PrimaryCell
                              title={`${String(row.first_name ?? "")} ${String(row.last_name ?? "")}`.trim()}
                              subtitle={String(row.day_of_week || "—")}
                            />
                          )
                        },
                        { label: "Start", render: (row) => formatTime(row.start_time) },
                        { label: "End", render: (row) => formatTime(row.end_time) },
                        {
                          label: "Actions",
                          align: "right",
                          render: (row) => (
                            <RowActions
                              onView={() => {
                                const provider = providersById.get(Number(row.provider_id));
                                if (provider) setDetail({ kind: "provider", row: provider });
                              }}
                              onEdit={() => openAvailabilityModal("edit", row)}
                              onDelete={() => askDeleteAvailability(row)}
                            />
                          )
                        }
                      ]}
                      mobileCard={(row) => (
                        <EntityCard
                          title={`${String(row.first_name ?? "")} ${String(row.last_name ?? "")}`.trim()}
                          subtitle={String(row.day_of_week || "—")}
                          meta={[
                            ["Start", formatTime(row.start_time)],
                            ["End", formatTime(row.end_time)]
                          ]}
                          actions={
                            <RowActions
                              stacked
                              onView={() => {
                                const provider = providersById.get(Number(row.provider_id));
                                if (provider) setDetail({ kind: "provider", row: provider });
                              }}
                              onEdit={() => openAvailabilityModal("edit", row)}
                              onDelete={() => askDeleteAvailability(row)}
                            />
                          }
                        />
                      )}
                    />
                  </section>
                )}

                {activeSection === "activity" && (
                  <section className="space-y-5">
                    <SectionIntro
                      title="Activity"
                      description="Review recent appointment audit events and operational changes."
                    />
                    <Toolbar>
                      <SearchField
                        label="Search activity"
                        value={activitySearch}
                        onChange={setActivitySearch}
                        placeholder="Search by user, reason, or status"
                      />
                    </Toolbar>
                    <ResponsiveTable
                      rows={filteredActivity}
                      emptyTitle="No activity entries match this search"
                      emptyBody="Try another search query."
                      columns={[
                        {
                          label: "Update",
                          render: (row) => (
                            <PrimaryCell
                              title={String(row.change_reason || "Status change")}
                              subtitle={`Appointment #${String(row.appointment_id || "—")}`}
                            />
                          )
                        },
                        { label: "Changed by", render: (row) => `${String(row.changed_by_first ?? "")} ${String(row.changed_by_last ?? "")}`.trim() || "—" },
                        { label: "From", render: (row) => String(row.old_status || "—") },
                        { label: "To", render: (row) => String(row.new_status || "—") },
                        { label: "Time", render: (row) => formatDateTime(row.change_timestamp) }
                      ]}
                      mobileCard={(row) => (
                        <EntityCard
                          title={String(row.change_reason || "Status change")}
                          subtitle={`Appointment #${String(row.appointment_id || "—")}`}
                          meta={[
                            ["Changed by", `${String(row.changed_by_first ?? "")} ${String(row.changed_by_last ?? "")}`.trim()],
                            ["From", String(row.old_status || "—")],
                            ["To", String(row.new_status || "—")],
                            ["Time", formatDateTime(row.change_timestamp)]
                          ]}
                        />
                      )}
                    />
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <ModalFrame
          title={modalTitle(modal)}
          description={modalDescription(modal)}
          errorText={modalError}
          onClose={() => {
            setModalError(null);
            setModal(null);
          }}
        >
          {modal.kind === "user" && (
            <UserForm
              mode={modal.mode}
              row={modal.row ?? null}
              currentSession={session}
              mutating={mutating}
              onCancel={() => {
                setModalError(null);
                setModal(null);
              }}
              onSubmit={async (form) => {
                await performMutation(async () => {
                  if (modal.mode === "create") {
                    await api("/api/users", {
                      method: "POST",
                      body: JSON.stringify(form)
                    });
                  } else {
                    await api("/api/users", {
                      method: "PUT",
                      body: JSON.stringify({
                        user_id: Number(modal.row?.user_id),
                        ...form
                      })
                    });
                  }
                }, modal.mode === "create" ? "User created." : "User updated.");
              }}
            />
          )}

          {modal.kind === "patient" && (
            <PatientForm
              mode={modal.mode}
              row={modal.row ?? null}
              usersById={usersById}
              mutating={mutating}
              onCancel={() => {
                setModalError(null);
                setModal(null);
              }}
              onSubmit={async (form) => {
                await performMutation(async () => {
                  if (modal.mode === "create") {
                    const createdUser = await api<DbRow>("/api/users", {
                      method: "POST",
                      body: JSON.stringify({
                        first_name: form.first_name,
                        last_name: form.last_name,
                        email: form.email,
                        password_hash: form.password_hash,
                        phone: form.phone,
                        role: "patient"
                      })
                    });

                    await api("/api/patients", {
                      method: "POST",
                      body: JSON.stringify({
                        user_id: Number(createdUser.data.user_id),
                        date_of_birth: form.date_of_birth,
                        gender: form.gender,
                        emergency_contact_name: form.emergency_contact_name,
                        emergency_contact_phone: form.emergency_contact_phone,
                        insurance_provider: form.insurance_provider,
                        insurance_policy_number: form.insurance_policy_number
                      })
                    });
                  } else {
                    const userId = Number(modal.row?.user_id);
                    await api("/api/users", {
                      method: "PUT",
                      body: JSON.stringify({
                        user_id: userId,
                        first_name: form.first_name,
                        last_name: form.last_name,
                        email: form.email,
                        phone: form.phone,
                        role: "patient"
                      })
                    });

                    await api("/api/patients", {
                      method: "PUT",
                      body: JSON.stringify({
                        patient_id: Number(modal.row?.patient_id),
                        date_of_birth: form.date_of_birth,
                        gender: form.gender,
                        emergency_contact_name: form.emergency_contact_name,
                        emergency_contact_phone: form.emergency_contact_phone,
                        insurance_provider: form.insurance_provider,
                        insurance_policy_number: form.insurance_policy_number
                      })
                    });
                  }
                }, modal.mode === "create" ? "Patient created." : "Patient updated.");
              }}
            />
          )}

          {modal.kind === "provider" && (
            <ProviderForm
              mode={modal.mode}
              row={modal.row ?? null}
              departments={datasets.departments}
              usersById={usersById}
              mutating={mutating}
              onCancel={() => {
                setModalError(null);
                setModal(null);
              }}
              onSubmit={async (form) => {
                await performMutation(async () => {
                  if (modal.mode === "create") {
                    const createdUser = await api<DbRow>("/api/users", {
                      method: "POST",
                      body: JSON.stringify({
                        first_name: form.first_name,
                        last_name: form.last_name,
                        email: form.email,
                        password_hash: form.password_hash,
                        phone: form.phone,
                        role: "provider"
                      })
                    });

                    await api("/api/providers", {
                      method: "POST",
                      body: JSON.stringify({
                        user_id: Number(createdUser.data.user_id),
                        department_id: Number(form.department_id),
                        specialty: form.specialty,
                        license_number: form.license_number
                      })
                    });
                  } else {
                    const userId = Number(modal.row?.user_id);
                    await api("/api/users", {
                      method: "PUT",
                      body: JSON.stringify({
                        user_id: userId,
                        first_name: form.first_name,
                        last_name: form.last_name,
                        email: form.email,
                        phone: form.phone,
                        role: "provider"
                      })
                    });

                    await api("/api/providers", {
                      method: "PUT",
                      body: JSON.stringify({
                        provider_id: Number(modal.row?.provider_id),
                        department_id: Number(form.department_id),
                        specialty: form.specialty,
                        license_number: form.license_number
                      })
                    });
                  }
                }, modal.mode === "create" ? "Provider created." : "Provider updated.");
              }}
            />
          )}

          {modal.kind === "appointment" && (
            <AppointmentForm
              mode={modal.mode}
              row={modal.row ?? null}
              patients={patientOptions}
              providers={providerOptions}
              departments={departmentOptions}
              statuses={statusOptions}
              mutating={mutating}
              onCancel={() => {
                setModalError(null);
                setModal(null);
              }}
              onSubmit={async (form) => {
                const provider = providersById.get(Number(form.provider_id));
                await performMutation(async () => {
                  const payload = {
                    ...form,
                    provider_id: Number(form.provider_id),
                    patient_id: Number(form.patient_id),
                    department_id: Number(provider?.department_id ?? form.department_id),
                    status_id: Number(form.status_id),
                    changed_by: session.userId,
                    change_reason:
                      modal.mode === "create" ? "Scheduled from admin console" : "Updated from admin console"
                  };

                  if (modal.mode === "create") {
                    await api("/api/appointments", {
                      method: "POST",
                      body: JSON.stringify(payload)
                    });
                  } else {
                    await api("/api/appointments", {
                      method: "PUT",
                      body: JSON.stringify({
                        appointment_id: Number(modal.row?.appointment_id),
                        ...payload
                      })
                    });
                  }
                }, modal.mode === "create" ? "Appointment created." : "Appointment updated.");
              }}
            />
          )}

          {modal.kind === "department" && (
            <DepartmentForm
              mode={modal.mode}
              row={modal.row ?? null}
              mutating={mutating}
              onCancel={() => {
                setModalError(null);
                setModal(null);
              }}
              onSubmit={async (form) => {
                await performMutation(async () => {
                  if (modal.mode === "create") {
                    await api("/api/departments", {
                      method: "POST",
                      body: JSON.stringify(form)
                    });
                  } else {
                    await api("/api/departments", {
                      method: "PUT",
                      body: JSON.stringify({
                        department_id: Number(modal.row?.department_id),
                        ...form
                      })
                    });
                  }
                }, modal.mode === "create" ? "Department created." : "Department updated.");
              }}
            />
          )}

          {modal.kind === "availability" && (
            <AvailabilityForm
              mode={modal.mode}
              row={modal.row ?? null}
              providers={providerOptions}
              mutating={mutating}
              onCancel={() => {
                setModalError(null);
                setModal(null);
              }}
              onSubmit={async (form) => {
                await performMutation(async () => {
                  if (modal.mode === "create") {
                    await api("/api/availability", {
                      method: "POST",
                      body: JSON.stringify({
                        ...form,
                        provider_id: Number(form.provider_id)
                      })
                    });
                  } else {
                    await api("/api/availability", {
                      method: "PUT",
                      body: JSON.stringify({
                        availability_id: Number(modal.row?.availability_id),
                        ...form,
                        provider_id: Number(form.provider_id)
                      })
                    });
                  }
                }, modal.mode === "create" ? "Availability slot created." : "Availability slot updated.");
              }}
            />
          )}
        </ModalFrame>
      )}

      {detail && (
        <DetailModal
          detail={detail}
          datasets={datasets}
          usersById={usersById}
          availabilityByProvider={availabilityByProvider}
          onClose={() => setDetail(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          body={confirmState.body}
          confirmLabel={confirmState.confirmLabel}
          tone={confirmState.tone}
          loading={mutating}
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => {
            const action = confirmState.onConfirm;
            setConfirmState(null);
            await action();
          }}
        />
      )}
    </main>
  );
}

function modalTitle(modal: ModalState) {
  if (!modal) return "";
  const verb = modal.mode === "create" ? "Add" : "Edit";
  if (modal.kind === "user") return `${verb} user`;
  if (modal.kind === "patient") return `${verb} patient`;
  if (modal.kind === "provider") return `${verb} provider`;
  if (modal.kind === "appointment") return modal.mode === "create" ? "Schedule appointment" : "Edit appointment";
  if (modal.kind === "department") return `${verb} department`;
  return `${verb} availability`;
}

function modalDescription(modal: ModalState) {
  if (!modal) return "";
  if (modal.kind === "patient") return "Keep patient profile details and appointment context current.";
  if (modal.kind === "provider") return "Manage provider identity, specialty, and department placement.";
  if (modal.kind === "appointment") return "Use real schedule constraints to avoid invalid bookings.";
  if (modal.kind === "department") return "Update clinic specialty groups and contact details.";
  if (modal.kind === "availability") return "Set recurring provider availability windows.";
  return "Review account details without exposing sensitive credential data.";
}

function departmentNameFromId(id: number, departments: DbRow[]) {
  return String(
    departments.find((department) => Number(department.department_id) === id)?.department_name ?? ""
  );
}

function linkedProfileLabel(user: DbRow, datasets: AdminDatasets) {
  const userId = Number(user.user_id);
  const patient = datasets.patients.find((row) => Number(row.user_id) === userId);
  if (patient) return `Patient #${String(patient.patient_id)}`;
  const provider = datasets.providers.find((row) => Number(row.user_id) === userId);
  if (provider) return `Provider #${String(provider.provider_id)}`;
  return user.role === "admin" ? "Admin account" : "Not linked";
}

function OverviewSection({
  session,
  datasets,
  metrics,
  todaySchedule,
  recentActivity,
  onQuickAction
}: {
  session: SessionUser;
  datasets: AdminDatasets;
  metrics: {
    todayCount: number;
    upcomingCount: number;
    cancelledCount: number;
    pendingCount: number;
  };
  todaySchedule: DbRow[];
  recentActivity: DbRow[];
  onQuickAction: (action: "patient" | "provider" | "appointment" | "appointments") => void;
}) {
  return (
    <section className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
        <div className="panel overflow-hidden rounded-3xl border-slate-200/90 p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Clinic operations
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
                Good morning, {session.firstName}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Manage patients, providers, appointments, and clinic data from one secure workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="font-semibold">Operational focus</p>
              <p className="mt-1 text-blue-800/80">Scheduling, records, and daily coordination</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="primary-button" onClick={() => onQuickAction("patient")}>
              <Plus size={16} />
              Add patient
            </button>
            <button type="button" className="ghost-button" onClick={() => onQuickAction("provider")}>
              <Plus size={16} />
              Add provider
            </button>
            <button type="button" className="ghost-button" onClick={() => onQuickAction("appointment")}>
              <CalendarClock size={16} />
              Schedule appointment
            </button>
            <button type="button" className="ghost-button" onClick={() => onQuickAction("appointments")}>
              <ChevronRight size={16} />
              View all appointments
            </button>
          </div>
        </div>

        <div className="panel rounded-3xl border-slate-200/90 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
              <Shield size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Account summary</p>
              <p className="text-sm text-slate-500">{session.email}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <MetricLine label="Patients" value={datasets.patients.length} />
            <MetricLine label="Providers" value={datasets.providers.length} />
            <MetricLine label="Departments" value={datasets.departments.length} />
            <MetricLine label="User accounts" value={datasets.users.length} />
          </dl>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard icon={Users} label="Total patients" value={datasets.patients.length} tone="blue" />
        <StatCard icon={Stethoscope} label="Total providers" value={datasets.providers.length} tone="teal" />
        <StatCard icon={CalendarClock} label="Today’s appointments" value={metrics.todayCount} tone="emerald" />
        <StatCard icon={Clock3} label="Upcoming appointments" value={metrics.upcomingCount} tone="indigo" />
        <StatCard icon={Filter} label="Pending appointments" value={metrics.pendingCount} tone="amber" />
        <StatCard icon={Activity} label="Cancelled appointments" value={metrics.cancelledCount} tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start">
        <div className="panel overflow-hidden rounded-3xl xl:sticky xl:top-28">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Today’s schedule</h3>
                <p className="mt-1 text-sm text-slate-500">A quick look at the current clinic day.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {todaySchedule.length} visits
              </span>
            </div>
          </div>
          <div className="px-5 py-4 sm:px-6">
            {todaySchedule.length ? (
              <div className="space-y-3">
                {todaySchedule.map((row) => (
                  <div
                    key={String(row.appointment_id)}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatTime(row.start_time)} • {String(row.patient_first ?? "")} {String(row.patient_last ?? "")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {String(row.provider_first ?? "")} {String(row.provider_last ?? "")} •{" "}
                        {String(row.department_name ?? "")}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(row.status_name)}`}>
                      {String(row.status_name || "Scheduled")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No appointments scheduled today"
                body="The current seeded data doesn’t include visits for today yet."
              />
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="panel rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recent activity</h3>
                <p className="mt-1 text-sm text-slate-500">Latest appointment changes recorded in the audit log.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {recentActivity.length} entries
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {recentActivity.map((entry) => (
                <div key={String(entry.log_id)} className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {String(entry.change_reason || "Status updated")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {String(entry.changed_by_first ?? "")} {String(entry.changed_by_last ?? "")} •{" "}
                    {formatDateTime(entry.change_timestamp)}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    {String(entry.old_status || "New")} to {String(entry.new_status || "Updated")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upcoming queue</h3>
                <p className="mt-1 text-sm text-slate-500">The next scheduled visits across the clinic.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {datasets.appointments
                .filter((row) => String(row.appointment_date ?? "") >= isoToday())
                .slice(0, 5)
                .map((row) => (
                  <div key={String(row.appointment_id)} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDateShort(row.appointment_date)} • {formatTime(row.start_time)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {String(row.patient_first ?? "")} {String(row.patient_last ?? "")}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {String(row.department_name ?? "")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionIntro({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="panel rounded-3xl border-slate-200/90 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">{children}</div>
    </div>
  );
}

function SearchField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          className="form-input w-full pl-9"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="min-w-[11rem]">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <SelectInput value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectInput>
    </label>
  );
}

function rowKey(row: DbRow, index: number) {
  return String(
    row.log_id ??
      row.availability_id ??
      row.appointment_id ??
      row.patient_id ??
      row.user_id ??
      row.department_id ??
      row.provider_id ??
      `row-${index}`
  );
}

function ResponsiveTable({
  rows,
  columns,
  mobileCard,
  emptyTitle,
  emptyBody
}: {
  rows: DbRow[];
  columns: {
    label: string;
    render: (row: DbRow) => ReactNode;
    align?: "left" | "right";
  }[];
  mobileCard: (row: DbRow) => ReactNode;
  emptyTitle: string;
  emptyBody: string;
}) {
  if (!rows.length) {
    return (
      <div className="panel rounded-3xl px-6 py-14">
        <EmptyState title={emptyTitle} body={emptyBody} />
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-left">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.label}
                    className={`px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 ${
                      column.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                  key={rowKey(row, index)}
                  className={index === rows.length - 1 ? "" : "border-b border-slate-200"}
                >
                  {columns.map((column) => (
                    <td
                      key={column.label}
                      className={`px-5 py-4 align-top text-sm text-slate-700 ${
                        column.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {rows.map((row, index) => (
          <div key={rowKey(row, index)}>
            {mobileCard(row)}
          </div>
        ))}
      </div>
    </>
  );
}

function RowActions({
  onView,
  onEdit,
  onDelete,
  stacked = false
}: {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  stacked?: boolean;
}) {
  return (
    <div className={`flex ${stacked ? "flex-col" : "justify-end"} gap-2`}>
      {onView && (
        <button type="button" className="ghost-button justify-center" onClick={onView}>
          View
        </button>
      )}
      {onEdit && (
        <button type="button" className="ghost-button justify-center" onClick={onEdit}>
          Edit
        </button>
      )}
      {onDelete && (
        <button type="button" className="danger-button justify-center" onClick={onDelete} aria-label="Delete record">
          <Trash2 size={15} />
          Delete
        </button>
      )}
    </div>
  );
}

function PrimaryCell({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-900">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

function CountBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
      <span className="text-sm font-semibold text-slate-900">{value}</span>
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
    </div>
  );
}

function EntityCard({
  title,
  subtitle,
  meta,
  actions
}: {
  title: string;
  subtitle?: string;
  meta: Array<[string, string]>;
  actions?: ReactNode;
}) {
  return (
    <div className="panel rounded-3xl p-5">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {meta.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
            <dd className="mt-1 text-sm text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>
      {actions ? <div className="mt-4">{actions}</div> : null}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Settings2 size={20} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "blue" | "teal" | "emerald" | "indigo" | "amber" | "rose";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700"
  } as const;

  return (
    <div className="panel rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}>
          <Icon size={19} />
        </span>
      </div>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function ModalFrame({
  title,
  description,
  errorText,
  onClose,
  children
}: {
  title: string;
  description: string;
  errorText?: string | null;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/30 p-4 backdrop-blur-sm sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="panel rounded-[1.75rem] border-slate-200/90 shadow-[0_24px_72px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
            <button type="button" className="icon-button shrink-0" onClick={onClose} aria-label="Close dialog">
              <X size={18} />
            </button>
          </div>
          <div className="px-5 py-5 sm:px-6">
            {errorText ? (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">
                {errorText}
              </div>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  tone = "danger",
  loading,
  onCancel,
  onConfirm
}: {
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-md rounded-[1.5rem] p-6 shadow-[0_24px_72px_rgba(15,23,42,0.18)]">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="ghost-button justify-center" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={tone === "danger" ? "danger-button justify-center" : "primary-button justify-center"}
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function SelectInput({
  className = "",
  children,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return (
    <div className="relative">
      <select {...props} className={`form-input form-select w-full ${className}`.trim()}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
    </div>
  );
}

function FormFooter({
  onCancel,
  submitLabel,
  mutating
}: {
  onCancel: () => void;
  submitLabel: string;
  mutating: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
      <button type="button" className="ghost-button justify-center" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="primary-button justify-center" disabled={mutating}>
        {mutating ? <Loader2 className="animate-spin" size={16} /> : null}
        {submitLabel}
      </button>
    </div>
  );
}

function UserForm({
  mode,
  row,
  currentSession,
  mutating,
  onCancel,
  onSubmit
}: {
  mode: "create" | "edit";
  row: DbRow | null;
  currentSession: SessionUser;
  mutating: boolean;
  onCancel: () => void;
  onSubmit: (form: typeof userDefaults) => Promise<void>;
}) {
  const [form, setForm] = useState(() => ({
    ...userDefaults,
    first_name: String(row?.first_name ?? ""),
    last_name: String(row?.last_name ?? ""),
    email: String(row?.email ?? ""),
    phone: String(row?.phone ?? ""),
    role: String(row?.role ?? "patient"),
    password_hash: ""
  }));

  const linkedRoleLocked =
    mode === "edit" &&
    (currentSession.userId === Number(row?.user_id) || row?.role === "provider" || row?.role === "patient");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(form);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input className="form-input" value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} required />
        </Field>
        <Field label="Last name">
          <input className="form-input" value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <input className="form-input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </Field>
        <Field label="Phone">
          <input className="form-input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Role"
          hint={
            linkedRoleLocked
              ? "Linked patient/provider accounts keep their role fixed here."
              : "Choose the account role for this user."
          }
        >
          <select
            className="form-input"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            disabled={linkedRoleLocked}
          >
            <option value="patient">Patient</option>
            <option value="provider">Provider</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        {mode === "create" ? (
          <Field label="Password hash/value" hint="This app uses the existing demo-compatible login behavior.">
            <input
              className="form-input"
              value={form.password_hash}
              onChange={(event) => setForm({ ...form, password_hash: event.target.value })}
              required
            />
          </Field>
        ) : (
          <Field label="Password">
            <div className="form-input flex items-center bg-slate-50 text-slate-500">
              Password updates are intentionally not exposed here.
            </div>
          </Field>
        )}
      </div>
      <FormFooter onCancel={onCancel} submitLabel={mode === "create" ? "Create user" : "Save changes"} mutating={mutating} />
    </form>
  );
}

function PatientForm({
  mode,
  row,
  usersById,
  mutating,
  onCancel,
  onSubmit
}: {
  mode: "create" | "edit";
  row: DbRow | null;
  usersById: Map<number, DbRow>;
  mutating: boolean;
  onCancel: () => void;
  onSubmit: (form: typeof patientDefaults) => Promise<void>;
}) {
  const linkedUser = row ? usersById.get(Number(row.user_id)) : null;
  const [form, setForm] = useState(() => ({
    ...patientDefaults,
    first_name: String(linkedUser?.first_name ?? ""),
    last_name: String(linkedUser?.last_name ?? ""),
    email: String(linkedUser?.email ?? ""),
    phone: String(linkedUser?.phone ?? ""),
    date_of_birth: String(row?.date_of_birth ?? ""),
    gender: String(row?.gender ?? "female"),
    emergency_contact_name: String(row?.emergency_contact_name ?? ""),
    emergency_contact_phone: String(row?.emergency_contact_phone ?? ""),
    insurance_provider: String(row?.insurance_provider ?? ""),
    insurance_policy_number: String(row?.insurance_policy_number ?? ""),
    password_hash: ""
  }));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(form);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input className="form-input" value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} required />
        </Field>
        <Field label="Last name">
          <input className="form-input" value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <input className="form-input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </Field>
        <Field label="Phone">
          <input className="form-input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
      </div>
      {mode === "create" && (
        <Field label="Password hash/value" hint="Use a local/demo password value compatible with the existing login flow.">
          <input className="form-input" value={form.password_hash} onChange={(event) => setForm({ ...form, password_hash: event.target.value })} required />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth">
          <input className="form-input" type="date" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} required />
        </Field>
        <Field label="Gender">
          <select className="form-input" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Emergency contact name">
          <input className="form-input" value={form.emergency_contact_name} onChange={(event) => setForm({ ...form, emergency_contact_name: event.target.value })} />
        </Field>
        <Field label="Emergency contact phone">
          <input className="form-input" value={form.emergency_contact_phone} onChange={(event) => setForm({ ...form, emergency_contact_phone: event.target.value })} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Insurance provider">
          <input className="form-input" value={form.insurance_provider} onChange={(event) => setForm({ ...form, insurance_provider: event.target.value })} />
        </Field>
        <Field label="Policy number">
          <input className="form-input" value={form.insurance_policy_number} onChange={(event) => setForm({ ...form, insurance_policy_number: event.target.value })} />
        </Field>
      </div>
      <FormFooter onCancel={onCancel} submitLabel={mode === "create" ? "Create patient" : "Save changes"} mutating={mutating} />
    </form>
  );
}

function ProviderForm({
  mode,
  row,
  departments,
  usersById,
  mutating,
  onCancel,
  onSubmit
}: {
  mode: "create" | "edit";
  row: DbRow | null;
  departments: DbRow[];
  usersById: Map<number, DbRow>;
  mutating: boolean;
  onCancel: () => void;
  onSubmit: (form: typeof providerDefaults) => Promise<void>;
}) {
  const linkedUser = row ? usersById.get(Number(row.user_id)) : null;
  const [form, setForm] = useState(() => ({
    ...providerDefaults,
    first_name: String(linkedUser?.first_name ?? ""),
    last_name: String(linkedUser?.last_name ?? ""),
    email: String(linkedUser?.email ?? ""),
    phone: String(linkedUser?.phone ?? ""),
    department_id: String(row?.department_id ?? ""),
    specialty: String(row?.specialty ?? ""),
    license_number: String(row?.license_number ?? ""),
    password_hash: ""
  }));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(form);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input className="form-input" value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} required />
        </Field>
        <Field label="Last name">
          <input className="form-input" value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <input className="form-input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </Field>
        <Field label="Phone">
          <input className="form-input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
      </div>
      {mode === "create" && (
        <Field label="Password hash/value" hint="Use a local/demo password value compatible with the current login flow.">
          <input className="form-input" value={form.password_hash} onChange={(event) => setForm({ ...form, password_hash: event.target.value })} required />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Department">
          <select className="form-input" value={form.department_id} onChange={(event) => setForm({ ...form, department_id: event.target.value })} required>
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={String(department.department_id)} value={String(department.department_id)}>
                {String(department.department_name)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Specialty">
          <input className="form-input" value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} required />
        </Field>
      </div>
      <Field label="License number">
        <input className="form-input" value={form.license_number} onChange={(event) => setForm({ ...form, license_number: event.target.value })} required />
      </Field>
      <FormFooter onCancel={onCancel} submitLabel={mode === "create" ? "Create provider" : "Save changes"} mutating={mutating} />
    </form>
  );
}

function AppointmentForm({
  mode,
  row,
  patients,
  providers,
  departments,
  statuses,
  mutating,
  onCancel,
  onSubmit
}: {
  mode: "create" | "edit";
  row: DbRow | null;
  patients: { value: string; label: string }[];
  providers: { value: string; label: string }[];
  departments: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
  mutating: boolean;
  onCancel: () => void;
  onSubmit: (form: typeof appointmentDefaults) => Promise<void>;
}) {
  const [form, setForm] = useState(() => ({
    ...appointmentDefaults,
    patient_id: String(row?.patient_id ?? ""),
    provider_id: String(row?.provider_id ?? ""),
    department_id: String(row?.department_id ?? ""),
    status_id: String(row?.status_id ?? statuses.at(0)?.value ?? ""),
    appointment_date: String(row?.appointment_date ?? recommendedBookingDate()),
    start_time: toInputTime(row?.start_time ?? "09:00"),
    end_time: toInputTime(row?.end_time ?? "09:30"),
    reason: String(row?.reason ?? ""),
    notes: String(row?.notes ?? "")
  }));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(form);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Patient">
          <SelectInput value={form.patient_id} onChange={(event) => setForm({ ...form, patient_id: event.target.value })} required>
            <option value="">Select patient</option>
            {patients.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Provider">
          <SelectInput value={form.provider_id} onChange={(event) => setForm({ ...form, provider_id: event.target.value })} required>
            <option value="">Select provider</option>
            {providers.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Status" hint="Choose how this appointment should appear on the clinic schedule.">
          <SelectInput value={form.status_id} onChange={(event) => setForm({ ...form, status_id: event.target.value })} required>
            {statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Department" hint="This stays aligned with the selected provider when the record is saved.">
          <SelectInput value={form.department_id} onChange={(event) => setForm({ ...form, department_id: event.target.value })}>
            <option value="">Select department</option>
            {departments.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date" hint="Admins can place same-day and near-term bookings when operations need it.">
          <input
            className="form-input"
            type="date"
            value={form.appointment_date}
            onChange={(event) => setForm({ ...form, appointment_date: event.target.value })}
            required
          />
        </Field>
        <Field label="Start time">
          <input className="form-input" type="time" value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} required />
        </Field>
        <Field label="End time">
          <input className="form-input" type="time" value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} required />
        </Field>
      </div>
      <Field label="Reason">
        <input className="form-input" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
      </Field>
      <Field label="Notes">
        <textarea className="form-input min-h-28 resize-y" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      </Field>
      <FormFooter onCancel={onCancel} submitLabel={mode === "create" ? "Create appointment" : "Save changes"} mutating={mutating} />
    </form>
  );
}

function DepartmentForm({
  mode,
  row,
  mutating,
  onCancel,
  onSubmit
}: {
  mode: "create" | "edit";
  row: DbRow | null;
  mutating: boolean;
  onCancel: () => void;
  onSubmit: (form: typeof departmentDefaults) => Promise<void>;
}) {
  const [form, setForm] = useState(() => ({
    ...departmentDefaults,
    department_name: String(row?.department_name ?? ""),
    location: String(row?.location ?? ""),
    phone: String(row?.phone ?? "")
  }));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(form);
      }}
    >
      <Field label="Department name">
        <input className="form-input" value={form.department_name} onChange={(event) => setForm({ ...form, department_name: event.target.value })} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location">
          <input className="form-input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
        </Field>
        <Field label="Phone">
          <input className="form-input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
      </div>
      <FormFooter onCancel={onCancel} submitLabel={mode === "create" ? "Create department" : "Save changes"} mutating={mutating} />
    </form>
  );
}

function AvailabilityForm({
  mode,
  row,
  providers,
  mutating,
  onCancel,
  onSubmit
}: {
  mode: "create" | "edit";
  row: DbRow | null;
  providers: { value: string; label: string }[];
  mutating: boolean;
  onCancel: () => void;
  onSubmit: (form: typeof availabilityDefaults) => Promise<void>;
}) {
  const [form, setForm] = useState(() => ({
    ...availabilityDefaults,
    provider_id: String(row?.provider_id ?? ""),
    day_of_week: String(row?.day_of_week ?? "Monday"),
    start_time: toInputTime(row?.start_time ?? "09:00"),
    end_time: toInputTime(row?.end_time ?? "17:00")
  }));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(form);
      }}
    >
      <Field label="Provider">
        <select className="form-input" value={form.provider_id} onChange={(event) => setForm({ ...form, provider_id: event.target.value })} required>
          <option value="">Select provider</option>
          {providers.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Day of week">
          <select className="form-input" value={form.day_of_week} onChange={(event) => setForm({ ...form, day_of_week: event.target.value })}>
            {weekdays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start time">
          <input className="form-input" type="time" value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} required />
        </Field>
        <Field label="End time">
          <input className="form-input" type="time" value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} required />
        </Field>
      </div>
      <FormFooter onCancel={onCancel} submitLabel={mode === "create" ? "Create slot" : "Save changes"} mutating={mutating} />
    </form>
  );
}

function DetailModal({
  detail,
  datasets,
  usersById,
  availabilityByProvider,
  onClose
}: {
  detail: DetailState;
  datasets: AdminDatasets;
  usersById: Map<number, DbRow>;
  availabilityByProvider: Map<number, DbRow[]>;
  onClose: () => void;
}) {
  if (!detail) return null;

  if (detail.kind === "patient") {
    const patientAppointments = datasets.appointments
      .filter((appointment) => Number(appointment.patient_id) === Number(detail.row.patient_id))
      .sort((left, right) => String(right.appointment_date ?? "").localeCompare(String(left.appointment_date ?? "")));
    const user = usersById.get(Number(detail.row.user_id));
    return (
      <ModalFrame title="Patient details" description="Profile, visits, and supporting contact details." onClose={onClose}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <PrimaryCell title={fullName(user ?? detail.row)} subtitle={String(user?.email ?? "No email")} />
            <DetailLine label="Phone" value={formatPhone(user?.phone)} />
            <DetailLine label="Date of birth" value={formatDate(detail.row.date_of_birth)} />
            <DetailLine label="Gender" value={String(detail.row.gender ?? "—")} />
            <DetailLine label="Emergency contact" value={String(detail.row.emergency_contact_name || "—")} />
            <DetailLine label="Emergency phone" value={formatPhone(detail.row.emergency_contact_phone)} />
            <DetailLine label="Insurance" value={String(detail.row.insurance_provider || "—")} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Appointments</h3>
            <div className="mt-3 space-y-3">
              {patientAppointments.length ? (
                patientAppointments.map((appointment) => (
                  <MiniRecord
                    key={String(appointment.appointment_id)}
                    title={`${formatDate(appointment.appointment_date)} • ${formatTime(appointment.start_time)}`}
                    subtitle={`${String(appointment.provider_first ?? "")} ${String(appointment.provider_last ?? "")}`.trim()}
                    badge={String(appointment.status_name || "—")}
                    badgeTone={statusTone(appointment.status_name)}
                  />
                ))
              ) : (
                <EmptyState title="No appointments yet" body="This patient does not currently have appointment history." />
              )}
            </div>
          </div>
        </div>
      </ModalFrame>
    );
  }

  if (detail.kind === "provider") {
    const providerAppointments = datasets.appointments
      .filter((appointment) => Number(appointment.provider_id) === Number(detail.row.provider_id))
      .sort((left, right) => String(left.appointment_date ?? "").localeCompare(String(right.appointment_date ?? "")));
    const slots = availabilityByProvider.get(Number(detail.row.provider_id)) ?? [];
    const user = usersById.get(Number(detail.row.user_id));

    return (
      <ModalFrame title="Provider details" description="Profile, specialty placement, availability, and upcoming visits." onClose={onClose}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <PrimaryCell title={fullName(user ?? detail.row)} subtitle={String(detail.row.specialty ?? "—")} />
            <DetailLine label="Department" value={String(detail.row.department_name || "—")} />
            <DetailLine label="Email" value={String(user?.email || "—")} />
            <DetailLine label="Phone" value={formatPhone(user?.phone)} />
            <DetailLine label="License" value={String(detail.row.license_number || "—")} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Availability</p>
              <div className="mt-3 space-y-2">
                {slots.length ? (
                  slots.map((slot) => (
                    <div key={String(slot.availability_id)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      {String(slot.day_of_week)} • {formatTime(slot.start_time)} to {formatTime(slot.end_time)}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No availability windows recorded.</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Upcoming appointments</h3>
            <div className="mt-3 space-y-3">
              {providerAppointments.length ? (
                providerAppointments.map((appointment) => (
                  <MiniRecord
                    key={String(appointment.appointment_id)}
                    title={`${formatDate(appointment.appointment_date)} • ${formatTime(appointment.start_time)}`}
                    subtitle={`${String(appointment.patient_first ?? "")} ${String(appointment.patient_last ?? "")}`.trim()}
                    badge={String(appointment.status_name || "—")}
                    badgeTone={statusTone(appointment.status_name)}
                  />
                ))
              ) : (
                <EmptyState title="No appointments yet" body="This provider does not currently have scheduled visits." />
              )}
            </div>
          </div>
        </div>
      </ModalFrame>
    );
  }

  if (detail.kind === "appointment") {
    return (
      <ModalFrame title="Appointment details" description="Review the full visit context for this appointment." onClose={onClose}>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailLine label="Date" value={formatDate(detail.row.appointment_date)} />
          <DetailLine label="Time" value={`${formatTime(detail.row.start_time)} to ${formatTime(detail.row.end_time)}`} />
          <DetailLine label="Patient" value={`${String(detail.row.patient_first ?? "")} ${String(detail.row.patient_last ?? "")}`.trim() || "—"} />
          <DetailLine label="Provider" value={`${String(detail.row.provider_first ?? "")} ${String(detail.row.provider_last ?? "")}`.trim() || "—"} />
          <DetailLine label="Department" value={String(detail.row.department_name || "—")} />
          <DetailLine label="Status" value={String(detail.row.status_name || "—")} />
        </div>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Reason</p>
          <p className="mt-2 text-sm text-slate-700">{String(detail.row.reason || "No reason entered.")}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Notes</p>
          <p className="mt-2 text-sm text-slate-700">{String(detail.row.notes || "No notes recorded.")}</p>
        </div>
      </ModalFrame>
    );
  }

  if (detail.kind === "user") {
    return (
      <ModalFrame title="User details" description="Safe account fields only — no password hashes or secrets are shown here." onClose={onClose}>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailLine label="Name" value={fullName(detail.row)} />
          <DetailLine label="Email" value={String(detail.row.email || "—")} />
          <DetailLine label="Phone" value={formatPhone(detail.row.phone)} />
          <DetailLine label="Role" value={String(detail.row.role || "—")} />
          <DetailLine label="Created" value={formatDateTime(detail.row.created_at)} />
          <DetailLine label="Linked profile" value={linkedProfileLabel(detail.row, datasets)} />
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame title="Department details" description="Review department scale and contact context." onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailLine label="Department" value={String(detail.row.department_name || "—")} />
        <DetailLine label="Location" value={String(detail.row.location || "—")} />
        <DetailLine label="Phone" value={formatPhone(detail.row.phone)} />
        <DetailLine label="Providers" value={String(detail.row.providers || 0)} />
        <DetailLine label="Appointments" value={String(detail.row.appointments || 0)} />
      </div>
    </ModalFrame>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function MiniRecord({
  title,
  subtitle,
  badge,
  badgeTone
}: {
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeTone}`}>
        {badge}
      </span>
    </div>
  );
}
