"use client";

import Link from "next/link";
import {
  CalendarClock,
  HeartPulse,
  Loader2,
  LogIn,
  LogOut,
  UserRoundPlus
} from "lucide-react";
import type { ReactNode } from "react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminConsole } from "@/components/AdminConsole";
import { PatientPortalView, ProviderPortalView } from "@/components/PortalDashboards";
import {
  bookingLeadError,
  isAtLeastHoursAhead,
  MIN_APPOINTMENT_LEAD_HOURS,
  recommendedBookingDate
} from "@/lib/appointment-rules";
import { DoctorCard, SessionUser } from "@/lib/types";

const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;

type ApiResponse<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; details?: string };

type PatientPortalData = {
  profile: Record<string, string | number | null>;
  doctors: DoctorCard[];
  appointments: Record<string, string | number | null>[];
};

type ProviderPortalData = {
  profile: Record<string, string | number | null>;
  appointments: Record<string, string | number | null>[];
  availability: Record<string, string | number | null>[];
  statuses: Record<string, string | number | null>[];
};

type UiRole = "patient" | "provider" | "admin";

const sessionKey = "healthcare-session";

const seedCredentials = [
  { label: "Admin demo", email: "admin@hospital.com", password_hash: "hash5", role: "admin" },
  { label: "Patient demo", email: "john.doe@email.com", password_hash: "hash1", role: "patient" },
  { label: "Provider demo", email: "alice.brown@email.com", password_hash: "hash3", role: "provider" }
];

const shouldAutofillDemoCredentials = process.env.NODE_ENV !== "production";

const patientTabs = [
  { id: "overview", label: "Overview" },
  { id: "book", label: "Book care" },
  { id: "appointments", label: "My Appointments" },
  { id: "doctors", label: "Doctors" },
  { id: "profile", label: "Profile" }
] as const;

const providerTabs = [
  { id: "overview", label: "Overview" },
  { id: "today", label: "Today" },
  { id: "appointments", label: "Appointments" },
  { id: "availability", label: "Availability" },
  { id: "profile", label: "Profile" }
] as const;

function getSeedCredential(role: UiRole) {
  return seedCredentials.find((sample) => sample.role === role);
}

const roleMeta: Record<
  UiRole,
  {
    label: string;
    loginHelper: string;
    signupHelper: string;
    signupNote?: string;
  }
> = {
  patient: {
    label: "Patient",
    loginHelper: "Continue managing your appointments and care.",
    signupHelper: "Browse doctors, book visits, and manage upcoming appointments."
  },
  provider: {
    label: "Provider",
    loginHelper: "Review your schedule and appointment workflows.",
    signupHelper: "Access schedule tools and appointment workflows for your clinic.",
    signupNote: "Provider accounts may require clinic approval or invitation."
  },
  admin: {
    label: "Admin",
    loginHelper: "Access the operational console.",
    signupHelper: "Admin accounts are usually created by an existing administrator.",
    signupNote: "Admin accounts are usually created by an existing administrator."
  }
};

type AppShellProps = {
  initialAuthMode?: "login" | "signup";
  authVariant?: "general" | "admin";
};

export function AppShell({
  initialAuthMode = "login",
  authVariant = "general"
}: AppShellProps = {}) {
  const initialRole: UiRole =
    authVariant === "admin" ? "admin" : initialAuthMode === "login" ? "admin" : "patient";
  const initialCredential = getSeedCredential(initialRole);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">(initialAuthMode);
  const [selectedRole, setSelectedRole] = useState<UiRole>(initialRole);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupLookups, setSignupLookups] = useState<{ departments: Record<string, string | number>[] }>({
    departments: []
  });
  const [patientData, setPatientData] = useState<PatientPortalData | null>(null);
  const [providerData, setProviderData] = useState<ProviderPortalData | null>(null);
  const [patientTab, setPatientTab] = useState<(typeof patientTabs)[number]["id"]>("overview");
  const [providerTab, setProviderTab] = useState<(typeof providerTabs)[number]["id"]>("overview");
  const [loginForm, setLoginForm] = useState({
    email: shouldAutofillDemoCredentials ? initialCredential?.email ?? "" : "",
    password_hash: shouldAutofillDemoCredentials ? initialCredential?.password_hash ?? "" : ""
  });
  const [signupForm, setSignupForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password_hash: "",
    phone: "",
    role: "patient",
    date_of_birth: "1997-04-19",
    gender: "female",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    insurance_provider: "",
    insurance_policy_number: "",
    department_id: "1",
    specialty: "",
    license_number: ""
  });
  const [bookingForm, setBookingForm] = useState({
    appointment_id: "",
    provider_id: "",
    appointment_date: recommendedBookingDate(),
    start_time: "09:00",
    end_time: "09:30",
    reason: "",
    notes: ""
  });
  const [patientProfileForm, setPatientProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "female",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    insurance_provider: "",
    insurance_policy_number: ""
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    availability_id: "",
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "17:00"
  });

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
    if (payload.message) setNotice({ type: "success", text: payload.message });
    return payload.data;
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionKey);
    if (raw) {
      try {
        setSession(JSON.parse(raw) as SessionUser);
      } catch {
        window.localStorage.removeItem(sessionKey);
      }
    }
    void api<{ departments: Record<string, string | number>[] }>("/api/auth/lookups")
      .then(setSignupLookups)
      .catch(() => undefined);
  }, [api]);

  const loadPatientPortal = useCallback(async (userId: number) => {
    setPatientData(
      await api<PatientPortalData>(`/api/portal/patient?userId=${userId}`)
    );
  }, [api]);

  const loadProviderPortal = useCallback(async (userId: number) => {
    setProviderData(
      await api<ProviderPortalData>(`/api/portal/provider?userId=${userId}`)
    );
  }, [api]);

  useEffect(() => {
    if (!session) return;
    if (session.role === "patient") {
      void loadPatientPortal(session.userId);
    }
    if (session.role === "provider") {
      void loadProviderPortal(session.userId);
    }
  }, [loadPatientPortal, loadProviderPortal, session]);

  useEffect(() => {
    if (!patientData?.profile) return;
    setPatientProfileForm({
      first_name: String(patientData.profile.first_name ?? ""),
      last_name: String(patientData.profile.last_name ?? ""),
      email: String(patientData.profile.email ?? ""),
      phone: String(patientData.profile.phone ?? ""),
      date_of_birth: String(patientData.profile.date_of_birth ?? ""),
      gender: String(patientData.profile.gender ?? "female"),
      emergency_contact_name: String(patientData.profile.emergency_contact_name ?? ""),
      emergency_contact_phone: String(patientData.profile.emergency_contact_phone ?? ""),
      insurance_provider: String(patientData.profile.insurance_provider ?? ""),
      insurance_policy_number: String(patientData.profile.insurance_policy_number ?? "")
    });
  }, [patientData]);

  useEffect(() => {
    if (authVariant === "admin") {
      setSelectedRole("admin");
      setAuthMode("login");
      if (shouldAutofillDemoCredentials) {
        const adminCredential = getSeedCredential("admin");
        setLoginForm({
          email: adminCredential?.email ?? "",
          password_hash: adminCredential?.password_hash ?? ""
        });
      }
    }
  }, [authVariant]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const nextSession = await api<SessionUser>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm)
      });
      setSession(nextSession);
      window.localStorage.setItem(sessionKey, JSON.stringify(nextSession));
      setNotice({ type: "success", text: `Welcome back, ${nextSession.firstName}.` });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signupForm.role === "admin") {
      setNotice({
        type: "error",
        text: "Admin accounts are usually created by an existing administrator."
      });
      return;
    }
    setLoading(true);
    try {
      const payload = { ...signupForm };
      const nextSession = await api<SessionUser>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSession(nextSession);
      window.localStorage.setItem(sessionKey, JSON.stringify(nextSession));
      setNotice({ type: "success", text: `Account created for ${nextSession.firstName}.` });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setSession(null);
    setPatientData(null);
    setProviderData(null);
    setNotice(null);
    window.localStorage.removeItem(sessionKey);
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    if (
      !isAtLeastHoursAhead(
        bookingForm.appointment_date,
        bookingForm.start_time,
        MIN_APPOINTMENT_LEAD_HOURS
      )
    ) {
      setNotice({ type: "error", text: bookingLeadError() });
      return;
    }
    setLoading(true);
    try {
      if (bookingForm.appointment_id) {
        await api("/api/portal/patient/appointments", {
          method: "PUT",
          body: JSON.stringify({
            ...bookingForm,
            user_id: session.userId,
            change_reason: "Patient rescheduled through portal"
          })
        });
      } else {
        await api("/api/portal/patient/appointments", {
          method: "POST",
          body: JSON.stringify({
            ...bookingForm,
            user_id: session.userId
          })
        });
      }
      setBookingForm({
        appointment_id: "",
        provider_id: "",
        appointment_date: recommendedBookingDate(),
        start_time: "09:00",
        end_time: "09:30",
        reason: "",
        notes: ""
      });
      await loadPatientPortal(session.userId);
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function cancelAppointment(appointmentId: number) {
    if (!session) return;
    setLoading(true);
    try {
      await api("/api/portal/patient/appointments", {
        method: "DELETE",
        body: JSON.stringify({
          appointment_id: appointmentId,
          user_id: session.userId,
          change_reason: "Patient cancelled through portal"
        })
      });
      await loadPatientPortal(session.userId);
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function savePatientProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setLoading(true);
    try {
      const data = await api<PatientPortalData>("/api/portal/patient/profile", {
        method: "PUT",
        body: JSON.stringify({
          user_id: session.userId,
          ...patientProfileForm
        })
      });
      setPatientData(data);
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function saveAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setLoading(true);
    try {
      const method = availabilityForm.availability_id ? "PUT" : "POST";
      const data = await api<ProviderPortalData>("/api/portal/provider/availability", {
        method,
        body: JSON.stringify({
          user_id: session.userId,
          ...availabilityForm
        })
      });
      setProviderData(data);
      setAvailabilityForm({
        availability_id: "",
        day_of_week: "Monday",
        start_time: "09:00",
        end_time: "17:00"
      });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function removeAvailability(availabilityId: number) {
    if (!session) return;
    setLoading(true);
    try {
      const data = await api<ProviderPortalData>("/api/portal/provider/availability", {
        method: "DELETE",
        body: JSON.stringify({
          user_id: session.userId,
          availability_id: availabilityId
        })
      });
      setProviderData(data);
      if (availabilityForm.availability_id === String(availabilityId)) {
        setAvailabilityForm({
          availability_id: "",
          day_of_week: "Monday",
          start_time: "09:00",
          end_time: "17:00"
        });
      }
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  const selectedDoctor = useMemo(
    () => patientData?.doctors.find((doctor) => String(doctor.provider_id) === bookingForm.provider_id) ?? null,
    [bookingForm.provider_id, patientData?.doctors]
  );

  const loginPanelCopy = roleMeta[selectedRole].loginHelper;
  const signupPanelCopy = roleMeta[selectedRole].signupHelper;
  const isAdminSignupSelection = authMode === "signup" && signupForm.role === "admin";
  const authHeading = authMode === "signup" && authVariant !== "admin" ? "Create your ClinicFlow account" : "Sign in";
  const authSubheading = authMode === "signup" && authVariant !== "admin" ? "Choose how you’ll use ClinicFlow." : loginPanelCopy;
  const visualHeading =
    authMode === "signup" && authVariant !== "admin"
      ? "Create your ClinicFlow account"
      : "Welcome back to ClinicFlow";
  const visualCopy =
    authMode === "signup" && authVariant !== "admin"
      ? "Start booking care, managing appointments, or coordinating clinic workflows."
      : "Sign in to book care, manage appointments, or run clinic operations.";

  function chooseRole(role: UiRole) {
    setSelectedRole(role);
    setSignupForm((current) => ({ ...current, role }));
    if (authMode === "login" && shouldAutofillDemoCredentials) {
      const credential = getSeedCredential(role);
      setLoginForm({
        email: credential?.email ?? "",
        password_hash: credential?.password_hash ?? ""
      });
    }
  }

  if (session?.role === "admin") {
    return <AdminConsole session={session} onLogout={logout} />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {notice && (
        <div className="sticky top-0 z-50 mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
          <div
            className={`rounded border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {notice.text}
          </div>
        </div>
      )}

      {!session && (
        <section className="mx-auto grid min-h-screen max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center lg:gap-12 lg:px-8 lg:py-4">
          <div className="order-2 flex flex-col justify-center lg:order-1">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
              <HeartPulse size={16} />
              ClinicFlow
            </div>
            <h1 className="mt-6 max-w-xl text-3xl font-semibold tracking-normal text-ink sm:mt-8 sm:text-4xl xl:text-5xl">
              {visualHeading}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {visualCopy}
            </p>
            <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft sm:block sm:mt-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Today&apos;s clinic flow</p>
                  <p className="mt-1 text-sm text-slate-500">A calmer way to coordinate care across patients, providers, and operations.</p>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Live scheduling
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Upcoming visit</p>
                      <p className="mt-3 text-base font-semibold text-slate-900">Dr. Alice Brown</p>
                      <p className="mt-1 text-sm text-slate-500">Cardiology consultation at 9:30 AM</p>
                    </div>
                    <CalendarClock className="text-blue-700" size={18} />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Operational status</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
                      <span>Patient booking</span>
                      <span className="font-semibold text-slate-900">Ready</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
                      <span>Provider schedule</span>
                      <span className="font-semibold text-slate-900">Aligned</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
                      <span>Admin oversight</span>
                      <span className="font-semibold text-slate-900">Visible</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 flex items-center lg:order-2 lg:-translate-y-3">
            <div className="panel w-full rounded-3xl border-slate-200/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
              <div>
                <h2 className="text-xl font-semibold text-ink sm:text-2xl">
                  {authHeading}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {authMode === "signup" && authVariant !== "admin" ? signupPanelCopy : authSubheading}
                </p>
              </div>

              <div className="mt-6">
                <RoleSelector
                  name={authMode === "signup" ? "signup-role" : "login-role"}
                  value={selectedRole}
                  onChange={chooseRole}
                  options={authVariant === "admin" ? (["admin"] as UiRole[]) : (["patient", "provider", "admin"] as UiRole[])}
                />
                {authMode === "login" && (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    The selected role personalizes this screen. Your actual access is still determined by your authenticated account.
                  </p>
                )}
                {authMode === "signup" && roleMeta[selectedRole].signupNote && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {roleMeta[selectedRole].signupNote}
                  </div>
                )}
              </div>

              {authMode === "login" ? (
                <form className="mt-6 space-y-3 sm:space-y-4" onSubmit={handleLogin}>
                  <FormField label="Email">
                    <input
                      className="form-input"
                      type="email"
                      value={loginForm.email}
                      onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Password">
                    <input
                      className="form-input"
                      type="password"
                      value={loginForm.password_hash}
                      onChange={(event) =>
                        setLoginForm({ ...loginForm, password_hash: event.target.value })
                      }
                      required
                    />
                  </FormField>
                  <button className="primary-button w-full justify-center" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={17} /> : <LogIn size={17} />}
                    Sign in
                  </button>
                  <div className="flex flex-col items-start gap-2 pt-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <Link href="/get-started" className="font-semibold text-blue-700 transition hover:text-blue-800">
                      Create an account
                    </Link>
                    <Link href="/" className="text-slate-500 transition hover:text-slate-800">
                      Back to homepage
                    </Link>
                  </div>
                </form>
              ) : (
                <form className="mt-6 space-y-3 sm:space-y-4" onSubmit={handleSignup}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="First name">
                      <input className="form-input" value={signupForm.first_name} onChange={(event) => setSignupForm({ ...signupForm, first_name: event.target.value })} required />
                    </FormField>
                    <FormField label="Last name">
                      <input className="form-input" value={signupForm.last_name} onChange={(event) => setSignupForm({ ...signupForm, last_name: event.target.value })} required />
                    </FormField>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Email">
                      <input className="form-input" type="email" value={signupForm.email} onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })} required />
                    </FormField>
                    <FormField label="Password">
                      <input className="form-input" type="password" value={signupForm.password_hash} onChange={(event) => setSignupForm({ ...signupForm, password_hash: event.target.value })} required />
                    </FormField>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Phone">
                      <input className="form-input" value={signupForm.phone} onChange={(event) => setSignupForm({ ...signupForm, phone: event.target.value })} />
                    </FormField>
                    <div className="flex items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Signing up as <span className="ml-1 font-semibold text-slate-900">{roleMeta[selectedRole].label}</span>
                    </div>
                  </div>

                  {signupForm.role === "patient" && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Date of birth">
                          <input className="form-input" type="date" value={signupForm.date_of_birth} onChange={(event) => setSignupForm({ ...signupForm, date_of_birth: event.target.value })} required />
                        </FormField>
                        <FormField label="Gender">
                          <select className="form-input" value={signupForm.gender} onChange={(event) => setSignupForm({ ...signupForm, gender: event.target.value })}>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="other">Other</option>
                          </select>
                        </FormField>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Emergency contact">
                          <input className="form-input" value={signupForm.emergency_contact_name} onChange={(event) => setSignupForm({ ...signupForm, emergency_contact_name: event.target.value })} />
                        </FormField>
                        <FormField label="Emergency phone">
                          <input className="form-input" value={signupForm.emergency_contact_phone} onChange={(event) => setSignupForm({ ...signupForm, emergency_contact_phone: event.target.value })} />
                        </FormField>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Insurance provider">
                          <input className="form-input" value={signupForm.insurance_provider} onChange={(event) => setSignupForm({ ...signupForm, insurance_provider: event.target.value })} />
                        </FormField>
                        <FormField label="Policy number">
                          <input className="form-input" value={signupForm.insurance_policy_number} onChange={(event) => setSignupForm({ ...signupForm, insurance_policy_number: event.target.value })} />
                        </FormField>
                      </div>
                    </>
                  )}

                  {signupForm.role === "provider" && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField label="Department">
                        <select className="form-input" value={signupForm.department_id} onChange={(event) => setSignupForm({ ...signupForm, department_id: event.target.value })}>
                          {signupLookups.departments.map((department) => (
                            <option key={String(department.department_id)} value={String(department.department_id)}>
                              {String(department.department_name)}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Specialty">
                        <input className="form-input" value={signupForm.specialty} onChange={(event) => setSignupForm({ ...signupForm, specialty: event.target.value })} required />
                      </FormField>
                      <FormField label="License number">
                        <input className="form-input" value={signupForm.license_number} onChange={(event) => setSignupForm({ ...signupForm, license_number: event.target.value })} required />
                      </FormField>
                    </div>
                  )}

                  {isAdminSignupSelection ? (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                      <p className="text-sm font-semibold text-blue-900">Admin registration is not part of the public signup flow.</p>
                      <p className="mt-2 text-sm leading-6 text-blue-800">
                        Admin accounts are usually created by an existing administrator.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link href="/admin/sign-in" className="primary-button">
                          Admin sign in
                        </Link>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => chooseRole("patient")}
                        >
                          Switch to patient signup
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="primary-button w-full justify-center" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" size={17} /> : <UserRoundPlus size={17} />}
                      Create account
                    </button>
                  )}

                  <div className="flex flex-col items-start gap-2 pt-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <Link href="/sign-in" className="font-semibold text-blue-700 transition hover:text-blue-800">
                      Already have an account? Sign in
                    </Link>
                    <Link href="/" className="text-slate-500 transition hover:text-slate-800">
                      Back to homepage
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {session?.role === "patient" && (
        <PatientPortalView
          session={session}
          data={patientData}
          activeTab={patientTab}
          onTabChange={setPatientTab}
          onLogout={logout}
          loading={loading}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          onSubmitBooking={submitBooking}
          onCancelAppointment={cancelAppointment}
          patientProfileForm={patientProfileForm}
          setPatientProfileForm={setPatientProfileForm}
          onSavePatientProfile={savePatientProfile}
        />
      )}

      {session?.role === "provider" && (
        <ProviderPortalView
          session={session}
          data={providerData}
          activeTab={providerTab}
          onTabChange={setProviderTab}
          onLogout={logout}
          loading={loading}
          availabilityForm={availabilityForm}
          setAvailabilityForm={setAvailabilityForm}
          onSaveAvailability={saveAvailability}
          onRemoveAvailability={removeAvailability}
          onUpdateAppointmentStatus={async (appointmentId, statusId, changeReason) => {
            if (!session) return;
            setLoading(true);
            try {
              const data = await api<ProviderPortalData>("/api/portal/provider/appointments", {
                method: "PUT",
                body: JSON.stringify({
                  user_id: session.userId,
                  appointment_id: appointmentId,
                  status_id: statusId,
                  change_reason: changeReason
                })
              });
              setProviderData(data);
            } catch (error) {
              setNotice({ type: "error", text: errorMessage(error) });
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </main>
  );
}

function RoleSelector({
  name,
  value,
  onChange,
  options
}: {
  name: string;
  value: UiRole;
  onChange: (role: UiRole) => void;
  options: UiRole[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">Account type</legend>
      <div
        className="inline-flex w-full flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1"
        role="radiogroup"
        aria-label="Account role"
      >
        {options.map((option) => (
          <label key={option} className="min-w-0 flex-1 cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span className="flex min-h-10 items-center justify-center rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm font-semibold text-slate-600 transition peer-checked:border-white peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-blue-200">
              {roleMeta[option].label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FormField({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}
