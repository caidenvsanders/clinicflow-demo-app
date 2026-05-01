"use client";

import {
  CalendarClock,
  ChevronRight,
  Clock3,
  HeartPulse,
  Loader2,
  LogOut,
  Search,
  Shield,
  Stethoscope,
  UserRound,
  UserRoundPlus
} from "lucide-react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { useMemo, useState } from "react";
import type { DoctorCard, SessionUser } from "@/lib/types";

type PatientRecord = Record<string, string | number | null>;
type ProviderRecord = Record<string, string | number | null>;

type PatientPortalData = {
  profile: PatientRecord;
  doctors: DoctorCard[];
  appointments: PatientRecord[];
};

type ProviderPortalData = {
  profile: ProviderRecord;
  appointments: ProviderRecord[];
  availability: ProviderRecord[];
  statuses: ProviderRecord[];
};

type PatientTab = "overview" | "book" | "appointments" | "doctors" | "profile";
type ProviderTab = "overview" | "today" | "appointments" | "availability" | "profile";

type BookingFormState = {
  appointment_id: string;
  provider_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  notes: string;
};

type PatientProfileFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  insurance_provider: string;
  insurance_policy_number: string;
};

type AvailabilityFormState = {
  availability_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

const EMPTY_PATIENT_RECORDS: PatientRecord[] = [];
const EMPTY_PROVIDER_RECORDS: ProviderRecord[] = [];
const EMPTY_DOCTORS: DoctorCard[] = [];

const patientNav: Array<{ id: PatientTab; label: string; icon: typeof HeartPulse }> = [
  { id: "overview", label: "Overview", icon: HeartPulse },
  { id: "book", label: "Book care", icon: CalendarClock },
  { id: "appointments", label: "My appointments", icon: Clock3 },
  { id: "doctors", label: "Doctors", icon: Stethoscope },
  { id: "profile", label: "Profile", icon: UserRound }
];

const providerNav: Array<{ id: ProviderTab; label: string; icon: typeof HeartPulse }> = [
  { id: "overview", label: "Overview", icon: HeartPulse },
  { id: "today", label: "Today", icon: CalendarClock },
  { id: "appointments", label: "Appointments", icon: Clock3 },
  { id: "availability", label: "Availability", icon: Stethoscope },
  { id: "profile", label: "Profile", icon: Shield }
];

function formatDate(value: unknown) {
  const text = String(value ?? "");
  if (!text) return "—";
  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function formatDateLong(value: unknown) {
  const text = String(value ?? "");
  if (!text) return "—";
  const date = new Date(`${text}T00:00:00`);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatTime(value: unknown) {
  const text = String(value ?? "");
  if (!text) return "—";
  const [hours, minutes] = text.split(":");
  const date = new Date();
  date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatPhone(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function fullName(first: unknown, last: unknown) {
  return `${String(first ?? "")} ${String(last ?? "")}`.trim() || "Unknown";
}

function statusTone(status: unknown) {
  const value = String(status ?? "").toLowerCase();
  if (value.includes("completed")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value.includes("cancel")) return "border-rose-200 bg-rose-50 text-rose-800";
  if (value.includes("no-show")) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

function appointmentStartsAt(row: PatientRecord | ProviderRecord) {
  return new Date(`${String(row.appointment_date ?? "")}T${String(row.start_time ?? "").slice(0, 5)}:00`);
}

function appointmentSortAsc(left: PatientRecord | ProviderRecord, right: PatientRecord | ProviderRecord) {
  return appointmentStartsAt(left).getTime() - appointmentStartsAt(right).getTime();
}

function appointmentSortDesc(left: PatientRecord | ProviderRecord, right: PatientRecord | ProviderRecord) {
  return appointmentStartsAt(right).getTime() - appointmentStartsAt(left).getTime();
}

export function PatientPortalView({
  session,
  data,
  activeTab,
  onTabChange,
  onLogout,
  loading,
  bookingForm,
  setBookingForm,
  onSubmitBooking,
  onCancelAppointment,
  patientProfileForm,
  setPatientProfileForm,
  onSavePatientProfile
}: {
  session: SessionUser;
  data: PatientPortalData | null;
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
  onLogout: () => void;
  loading: boolean;
  bookingForm: BookingFormState;
  setBookingForm: Dispatch<SetStateAction<BookingFormState>>;
  onSubmitBooking: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancelAppointment: (appointmentId: number) => Promise<void>;
  patientProfileForm: PatientProfileFormState;
  setPatientProfileForm: Dispatch<SetStateAction<PatientProfileFormState>>;
  onSavePatientProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [appointmentView, setAppointmentView] = useState<"upcoming" | "history" | "all">("upcoming");
  const [nowTime] = useState(() => Date.now());

  const doctors = data?.doctors ?? EMPTY_DOCTORS;
  const appointments = data?.appointments ?? EMPTY_PATIENT_RECORDS;
  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointmentStartsAt(appointment).getTime() >= nowTime &&
            String(appointment.status_name) !== "Completed"
        )
        .sort(appointmentSortAsc),
    [appointments, nowTime]
  );
  const historyAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointmentStartsAt(appointment).getTime() < nowTime ||
            String(appointment.status_name) === "Completed"
        )
        .sort(appointmentSortDesc),
    [appointments, nowTime]
  );
  const nextAppointment = upcomingAppointments[0] ?? null;
  const completedCount = appointments.filter((appointment) => String(appointment.status_name) === "Completed").length;
  const recentProvider = appointments[0]
    ? fullName(appointments[0].provider_first, appointments[0].provider_last)
    : "No recent provider";
  const specialties = Array.from(new Set(doctors.map((doctor) => doctor.specialty))).sort();
  const filteredDoctors = doctors.filter((doctor) => {
    const haystack = [
      doctor.first_name,
      doctor.last_name,
      doctor.specialty,
      doctor.department_name,
      doctor.availability_summary ?? ""
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(doctorSearch.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || doctor.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });
  const selectedDoctor =
    doctors.find((doctor) => String(doctor.provider_id) === bookingForm.provider_id) ?? null;
  const visibleAppointments =
    appointmentView === "upcoming"
      ? upcomingAppointments
      : appointmentView === "history"
        ? historyAppointments
        : [...appointments].sort(appointmentSortDesc);

  return (
    <PortalShell
      tone="patient"
      eyebrow="Patient portal"
      title={`Welcome back, ${session.firstName}`}
      subtitle="Manage your appointments, find providers, and keep your care on track."
      navItems={patientNav}
      activeTab={activeTab}
      onTabChange={(tab) => onTabChange(tab as PatientTab)}
      onLogout={onLogout}
    >
      {!data ? (
        <LoadingState label="Loading your care dashboard" />
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <PortalHeroCard
                tone="patient"
                title="Your care, organized"
                body="Book visits, review upcoming appointments, and keep your care moving."
                actions={
                  <>
                    <button type="button" className="primary-button" onClick={() => onTabChange("book")}>
                      <CalendarClock size={16} />
                      Book an appointment
                    </button>
                    <button type="button" className="ghost-button" onClick={() => onTabChange("doctors")}>
                      Browse doctors
                    </button>
                  </>
                }
                side={
                  <div className="grid gap-3">
                    <MiniInfo
                      label="Next visit"
                      value={
                        nextAppointment
                          ? `${formatDate(nextAppointment.appointment_date)} at ${formatTime(nextAppointment.start_time)}`
                          : "No upcoming visit"
                      }
                    />
                    <MiniInfo label="Recent provider" value={recentProvider} />
                  </div>
                }
              />

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <PortalStat label="Next appointment" value={nextAppointment ? formatDate(nextAppointment.appointment_date) : "None"} tone="blue" />
                <PortalStat label="Upcoming visits" value={String(upcomingAppointments.length)} tone="teal" />
                <PortalStat label="Completed visits" value={String(completedCount)} tone="emerald" />
                <PortalStat label="Doctors available" value={String(doctors.length)} tone="indigo" />
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <PanelSection
                  title="Upcoming appointments"
                  description="Your next scheduled visits and quick actions."
                  action={<button type="button" className="ghost-button" onClick={() => onTabChange("appointments")}>View all</button>}
                >
                  {upcomingAppointments.length ? (
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 3).map((appointment) => (
                        <AppointmentCard
                          key={String(appointment.appointment_id)}
                          title={`Dr. ${fullName(appointment.provider_first, appointment.provider_last)}`}
                          subtitle={`${String(appointment.specialty ?? "")} • ${String(appointment.department_name ?? "")}`}
                          meta={`${formatDateLong(appointment.appointment_date)} • ${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`}
                          status={String(appointment.status_name ?? "Scheduled")}
                          reason={String(appointment.reason ?? "General appointment")}
                          actions={
                            Number(appointment.status_id) === 1 ? (
                              <>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={() => {
                                    onTabChange("book");
                                    setBookingForm({
                                      appointment_id: String(appointment.appointment_id),
                                      provider_id: String(appointment.provider_id),
                                      appointment_date: String(appointment.appointment_date),
                                      start_time: String(appointment.start_time).slice(0, 5),
                                      end_time: String(appointment.end_time).slice(0, 5),
                                      reason: String(appointment.reason ?? ""),
                                      notes: String(appointment.notes ?? "")
                                    });
                                  }}
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  className="danger-button"
                                  onClick={() => void onCancelAppointment(Number(appointment.appointment_id))}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : null
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyStateCard
                      title="You do not have any upcoming appointments."
                      body="When you're ready, browse doctors and schedule your next visit."
                    />
                  )}
                </PanelSection>

                <PanelSection
                  title="Doctor spotlight"
                  description="Providers currently available in ClinicFlow."
                >
                  <div className="space-y-3">
                    {doctors.slice(0, 3).map((doctor) => (
                      <ProviderPreviewCard
                        key={doctor.provider_id}
                        doctor={doctor}
                        onSelect={() => {
                          onTabChange("book");
                          setBookingForm((current) => ({
                            ...current,
                            provider_id: String(doctor.provider_id)
                          }));
                        }}
                      />
                    ))}
                  </div>
                </PanelSection>
              </div>
            </div>
          )}

          {activeTab === "doctors" && (
            <div className="space-y-5">
              <SectionIntro
                title="Browse doctors"
                description="Search specialties, review availability, and choose the right provider for your next visit."
              />
              <ToolbarRow>
                <SearchBox
                  value={doctorSearch}
                  onChange={setDoctorSearch}
                  placeholder="Search by doctor, specialty, or department"
                />
                <InlineSelect
                  label="Specialty"
                  value={specialtyFilter}
                  onChange={setSpecialtyFilter}
                  options={[{ value: "all", label: "All specialties" }, ...specialties.map((value) => ({ value, label: value }))]}
                />
              </ToolbarRow>
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {filteredDoctors.map((doctor) => (
                  <DoctorCardTile
                    key={doctor.provider_id}
                    doctor={doctor}
                    selected={String(doctor.provider_id) === bookingForm.provider_id}
                    onSelect={() => {
                      onTabChange("book");
                      setBookingForm((current) => ({
                        ...current,
                        provider_id: String(doctor.provider_id)
                      }));
                    }}
                  />
                ))}
              </div>
              {!filteredDoctors.length && (
                <EmptyStateCard
                  title="No doctors match this view"
                  body="Try another specialty or broaden your search."
                />
              )}
            </div>
          )}

          {activeTab === "book" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_24rem]">
              <div className="space-y-5">
                <SectionIntro
                  title={bookingForm.appointment_id ? "Reschedule appointment" : "Book care"}
                  description="Choose a provider, pick a time, and confirm the details for your visit."
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <StepCard step="1" title="Choose provider" body="Pick the doctor who fits your visit." active />
                  <StepCard step="2" title="Choose date and time" body="Appointments need at least 24 hours of lead time." />
                  <StepCard step="3" title="Confirm details" body="Review your reason and save the visit." />
                </div>
                <div className="panel rounded-3xl p-5 sm:p-6">
                  <form className="grid gap-4" onSubmit={(event) => void onSubmitBooking(event)}>
                    <PortalField label="Provider">
                      <select
                        className="form-input"
                        value={bookingForm.provider_id}
                        onChange={(event) =>
                          setBookingForm((current) => ({ ...current, provider_id: event.target.value }))
                        }
                        required
                      >
                        <option value="">Select a provider</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.provider_id} value={String(doctor.provider_id)}>
                            Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialty}
                          </option>
                        ))}
                      </select>
                    </PortalField>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <PortalField label="Date" hint="Appointments must be booked at least 24 hours in advance.">
                        <input
                          className="form-input"
                          type="date"
                          min={bookingForm.appointment_date}
                          value={bookingForm.appointment_date}
                          onChange={(event) =>
                            setBookingForm((current) => ({ ...current, appointment_date: event.target.value }))
                          }
                          required
                        />
                      </PortalField>
                      <PortalField label="Start time">
                        <input
                          className="form-input"
                          type="time"
                          value={bookingForm.start_time}
                          onChange={(event) =>
                            setBookingForm((current) => ({ ...current, start_time: event.target.value }))
                          }
                          required
                        />
                      </PortalField>
                      <PortalField label="End time">
                        <input
                          className="form-input"
                          type="time"
                          value={bookingForm.end_time}
                          onChange={(event) =>
                            setBookingForm((current) => ({ ...current, end_time: event.target.value }))
                          }
                          required
                        />
                      </PortalField>
                    </div>
                    <PortalField label="Reason for visit">
                      <input
                        className="form-input"
                        value={bookingForm.reason}
                        onChange={(event) =>
                          setBookingForm((current) => ({ ...current, reason: event.target.value }))
                        }
                        placeholder="Annual checkup, follow-up, consultation..."
                      />
                    </PortalField>
                    <PortalField label="Notes">
                      <textarea
                        className="form-input min-h-28 resize-y"
                        value={bookingForm.notes}
                        onChange={(event) =>
                          setBookingForm((current) => ({ ...current, notes: event.target.value }))
                        }
                        placeholder="Anything you'd like the clinic to know before the visit."
                      />
                    </PortalField>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
                      <button
                        type="button"
                        className="ghost-button justify-center"
                        onClick={() =>
                          setBookingForm({
                            appointment_id: "",
                            provider_id: "",
                            appointment_date: bookingForm.appointment_date,
                            start_time: "09:00",
                            end_time: "09:30",
                            reason: "",
                            notes: ""
                          })
                        }
                      >
                        Clear form
                      </button>
                      <button type="submit" className="primary-button justify-center" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <CalendarClock size={16} />}
                        {bookingForm.appointment_id ? "Save reschedule" : "Book appointment"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="space-y-5">
                <PanelSection
                  title="Selected provider"
                  description="Review the doctor and their current availability summary."
                >
                  {selectedDoctor ? (
                    <DoctorCardTile doctor={selectedDoctor} selected onSelect={() => undefined} compact />
                  ) : (
                    <EmptyStateCard
                      title="Choose a provider"
                      body="Pick a doctor from the list to review specialty and availability details."
                    />
                  )}
                </PanelSection>
                <PanelSection title="What happens next" description="A quick preview of the booking flow.">
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      The clinic checks provider availability and overlap rules before the visit is saved.
                    </li>
                    <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      Upcoming visits will appear in your appointment list right away after booking.
                    </li>
                    <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      If your plans change, scheduled visits can still be rescheduled or cancelled from the portal.
                    </li>
                  </ul>
                </PanelSection>
              </div>
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-5">
              <SectionIntro
                title="My appointments"
                description="Review upcoming visits, completed care, and any cancelled appointments."
              />
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "upcoming", label: "Upcoming" },
                  { id: "history", label: "History" },
                  { id: "all", label: "All appointments" }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`table-tab ${appointmentView === option.id ? "table-tab-active" : ""}`}
                    onClick={() => setAppointmentView(option.id as "upcoming" | "history" | "all")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {visibleAppointments.map((appointment) => (
                  <AppointmentCard
                    key={String(appointment.appointment_id)}
                    title={`Dr. ${fullName(appointment.provider_first, appointment.provider_last)}`}
                    subtitle={`${String(appointment.specialty ?? "")} • ${String(appointment.department_name ?? "")}`}
                    meta={`${formatDateLong(appointment.appointment_date)} • ${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}`}
                    status={String(appointment.status_name ?? "Scheduled")}
                    reason={String(appointment.reason ?? "General appointment")}
                    notes={String(appointment.notes ?? "") || undefined}
                    actions={
                      Number(appointment.status_id) === 1 ? (
                        <>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => {
                              onTabChange("book");
                              setBookingForm({
                                appointment_id: String(appointment.appointment_id),
                                provider_id: String(appointment.provider_id),
                                appointment_date: String(appointment.appointment_date),
                                start_time: String(appointment.start_time).slice(0, 5),
                                end_time: String(appointment.end_time).slice(0, 5),
                                reason: String(appointment.reason ?? ""),
                                notes: String(appointment.notes ?? "")
                              });
                            }}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => void onCancelAppointment(Number(appointment.appointment_id))}
                          >
                            Cancel
                          </button>
                        </>
                      ) : null
                    }
                  />
                ))}
              </div>
              {!visibleAppointments.length && (
                <EmptyStateCard
                  title={appointmentView === "upcoming" ? "You do not have any upcoming appointments." : "No appointments found in this view."}
                  body="When you book care, your visits will show up here automatically."
                />
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="editor-shell">
                <div className="editor-header">
                  <p className="editor-kicker">Profile</p>
                  <h2 className="editor-title">Personal details</h2>
                  <p className="editor-copy">
                    Keep your contact details and care support information current for future visits.
                  </p>
                </div>
                <form className="mt-5 grid gap-4" onSubmit={(event) => void onSavePatientProfile(event)}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PortalField label="First name">
                      <input className="form-input" value={patientProfileForm.first_name} onChange={(event) => setPatientProfileForm((current) => ({ ...current, first_name: event.target.value }))} required />
                    </PortalField>
                    <PortalField label="Last name">
                      <input className="form-input" value={patientProfileForm.last_name} onChange={(event) => setPatientProfileForm((current) => ({ ...current, last_name: event.target.value }))} required />
                    </PortalField>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PortalField label="Email">
                      <input className="form-input" type="email" value={patientProfileForm.email} onChange={(event) => setPatientProfileForm((current) => ({ ...current, email: event.target.value }))} required />
                    </PortalField>
                    <PortalField label="Phone">
                      <input className="form-input" value={patientProfileForm.phone} onChange={(event) => setPatientProfileForm((current) => ({ ...current, phone: event.target.value }))} />
                    </PortalField>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PortalField label="Date of birth">
                      <input className="form-input" type="date" value={patientProfileForm.date_of_birth} onChange={(event) => setPatientProfileForm((current) => ({ ...current, date_of_birth: event.target.value }))} required />
                    </PortalField>
                    <PortalField label="Gender">
                      <select className="form-input" value={patientProfileForm.gender} onChange={(event) => setPatientProfileForm((current) => ({ ...current, gender: event.target.value }))}>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </PortalField>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PortalField label="Emergency contact">
                      <input className="form-input" value={patientProfileForm.emergency_contact_name} onChange={(event) => setPatientProfileForm((current) => ({ ...current, emergency_contact_name: event.target.value }))} />
                    </PortalField>
                    <PortalField label="Emergency phone">
                      <input className="form-input" value={patientProfileForm.emergency_contact_phone} onChange={(event) => setPatientProfileForm((current) => ({ ...current, emergency_contact_phone: event.target.value }))} />
                    </PortalField>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PortalField label="Insurance provider">
                      <input className="form-input" value={patientProfileForm.insurance_provider} onChange={(event) => setPatientProfileForm((current) => ({ ...current, insurance_provider: event.target.value }))} />
                    </PortalField>
                    <PortalField label="Policy number">
                      <input className="form-input" value={patientProfileForm.insurance_policy_number} onChange={(event) => setPatientProfileForm((current) => ({ ...current, insurance_policy_number: event.target.value }))} />
                    </PortalField>
                  </div>
                  <div className="editor-actions">
                    <p className="text-sm text-slate-500">Changes apply to your own patient profile only.</p>
                    <button type="submit" className="primary-button justify-center" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <UserRoundPlus size={16} />}
                      Save changes
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-5">
                <PanelSection title="Care summary" description="A quick look at your account and care activity.">
                  <div className="grid gap-3">
                    <MetricLine label="Total appointments" value={String(appointments.length)} />
                    <MetricLine label="Upcoming visits" value={String(upcomingAppointments.length)} />
                    <MetricLine label="Completed visits" value={String(completedCount)} />
                    <MetricLine label="Recent provider" value={recentProvider} />
                  </div>
                </PanelSection>
              </div>
            </div>
          )}
        </>
      )}
    </PortalShell>
  );
}

export function ProviderPortalView({
  session,
  data,
  activeTab,
  onTabChange,
  onLogout,
  loading,
  availabilityForm,
  setAvailabilityForm,
  onSaveAvailability,
  onRemoveAvailability,
  onUpdateAppointmentStatus
}: {
  session: SessionUser;
  data: ProviderPortalData | null;
  activeTab: ProviderTab;
  onTabChange: (tab: ProviderTab) => void;
  onLogout: () => void;
  loading: boolean;
  availabilityForm: AvailabilityFormState;
  setAvailabilityForm: Dispatch<SetStateAction<AvailabilityFormState>>;
  onSaveAvailability: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRemoveAvailability: (availabilityId: number) => Promise<void>;
  onUpdateAppointmentStatus: (appointmentId: number, statusId: number, changeReason?: string) => Promise<void>;
}) {
  const [appointmentView, setAppointmentView] = useState<"upcoming" | "past" | "all">("upcoming");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeContext] = useState(() => ({
    nowTime: Date.now(),
    today: new Date().toISOString().slice(0, 10)
  }));

  const appointments = data?.appointments ?? EMPTY_PROVIDER_RECORDS;
  const availability = data?.availability ?? EMPTY_PROVIDER_RECORDS;
  const statuses = data?.statuses ?? EMPTY_PROVIDER_RECORDS;
  const nowTime = timeContext.nowTime;
  const today = timeContext.today;
  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => String(appointment.appointment_date) === today)
        .sort(appointmentSortAsc),
    [appointments, today]
  );
  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointmentStartsAt(appointment).getTime() >= nowTime)
        .sort(appointmentSortAsc),
    [appointments, nowTime]
  );
  const pastAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointmentStartsAt(appointment).getTime() < nowTime)
        .sort(appointmentSortDesc),
    [appointments, nowTime]
  );
  const nextAppointment = upcomingAppointments[0] ?? null;
  const confirmedCount = appointments.filter((appointment) => String(appointment.status_name) === "Scheduled").length;
  const cancelledCount = appointments.filter((appointment) => String(appointment.status_name) === "Cancelled").length;
  const thisWeekCount = appointments.filter((appointment) => {
    const date = appointmentStartsAt(appointment);
    const diffDays = Math.floor((date.getTime() - nowTime) / (1000 * 60 * 60 * 24));
    return diffDays >= -1 && diffDays <= 6;
  }).length;
  const filteredAppointments = (appointmentView === "upcoming"
    ? upcomingAppointments
    : appointmentView === "past"
      ? pastAppointments
      : [...appointments].sort(appointmentSortDesc)
  ).filter((appointment) => {
    const haystack = [
      appointment.patient_first,
      appointment.patient_last,
      appointment.reason,
      appointment.department_name,
      appointment.status_name
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(appointmentSearch.toLowerCase());
    const matchesStatus = statusFilter === "all" || String(appointment.status_id) === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const appointmentsByDay = new Map<string, ProviderRecord[]>();
  upcomingAppointments.forEach((appointment) => {
    const key = String(appointment.appointment_date);
    const current = appointmentsByDay.get(key) ?? [];
    current.push(appointment);
    appointmentsByDay.set(key, current);
  });

  return (
    <PortalShell
      tone="provider"
      eyebrow="Provider portal"
      title={`Good morning, Dr. ${session.lastName}`}
      subtitle="Review today’s schedule and keep appointment workflows moving."
      navItems={providerNav}
      activeTab={activeTab}
      onTabChange={(tab) => onTabChange(tab as ProviderTab)}
      onLogout={onLogout}
    >
      {!data ? (
        <LoadingState label="Loading provider schedule" />
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <PortalHeroCard
                tone="provider"
                title="Today’s clinical schedule"
                body="Review visits, track appointment status, and manage your availability."
                actions={
                  <>
                    <button type="button" className="primary-button" onClick={() => onTabChange("today")}>
                      <CalendarClock size={16} />
                      View today’s schedule
                    </button>
                    <button type="button" className="ghost-button" onClick={() => onTabChange("availability")}>
                      Manage availability
                    </button>
                  </>
                }
                side={
                  <div className="grid gap-3">
                    <MiniInfo
                      label="Next appointment"
                      value={
                        nextAppointment
                          ? `${formatTime(nextAppointment.start_time)} • ${fullName(nextAppointment.patient_first, nextAppointment.patient_last)}`
                          : "No upcoming visit"
                      }
                    />
                    <MiniInfo
                      label="Department"
                      value={String(data.profile.department_name ?? "ClinicFlow")}
                    />
                  </div>
                }
              />

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <PortalStat label="Today’s appointments" value={String(todayAppointments.length)} tone="blue" />
                <PortalStat label="Next appointment" value={nextAppointment ? formatTime(nextAppointment.start_time) : "None"} tone="teal" />
                <PortalStat label="Scheduled" value={String(confirmedCount)} tone="emerald" />
                <PortalStat label="Cancelled" value={String(cancelledCount)} tone="rose" />
                <PortalStat label="This week" value={String(thisWeekCount)} tone="indigo" />
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <PanelSection
                  title="Today’s visits"
                  description="Your current clinic day, in chronological order."
                  action={<button type="button" className="ghost-button" onClick={() => onTabChange("today")}>Open today view</button>}
                >
                  {todayAppointments.length ? (
                    <div className="space-y-3">
                      {todayAppointments.slice(0, 4).map((appointment) => (
                        <WorkflowAppointmentCard
                          key={String(appointment.appointment_id)}
                          appointment={appointment}
                          statuses={statuses}
                          onUpdateStatus={onUpdateAppointmentStatus}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyStateCard
                      title="No appointments scheduled for today."
                      body="Today’s calendar is open right now."
                    />
                  )}
                </PanelSection>

                <PanelSection
                  title="This week"
                  description="Upcoming work grouped by visit day."
                >
                  <div className="space-y-4">
                    {Array.from(appointmentsByDay.entries())
                      .slice(0, 4)
                      .map(([date, dayAppointments]) => (
                        <div key={date} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-sm font-semibold text-slate-900">{formatDateLong(date)}</p>
                          <div className="mt-3 space-y-2">
                            {dayAppointments.slice(0, 3).map((appointment) => (
                              <div key={String(appointment.appointment_id)} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {formatTime(appointment.start_time)} • {fullName(appointment.patient_first, appointment.patient_last)}
                                  </p>
                                  <p className="text-sm text-slate-500">{String(appointment.reason ?? "General appointment")}</p>
                                </div>
                                <StatusBadge status={String(appointment.status_name)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </PanelSection>
              </div>
            </div>
          )}

          {activeTab === "today" && (
            <div className="space-y-5">
              <SectionIntro
                title="Today’s schedule"
                description="Stay focused on the current clinic day and keep appointment statuses moving."
              />
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <WorkflowAppointmentCard
                    key={String(appointment.appointment_id)}
                    appointment={appointment}
                    statuses={statuses}
                    onUpdateStatus={onUpdateAppointmentStatus}
                    detailed
                  />
                ))}
              </div>
              {!todayAppointments.length && (
                <EmptyStateCard
                  title="No appointments scheduled for today."
                  body="When patients book into your schedule, they’ll show up here first."
                />
              )}
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-5">
              <SectionIntro
                title="Appointments"
                description="Search upcoming and past visits, and update statuses for your own schedule."
              />
              <ToolbarRow>
                <SearchBox
                  value={appointmentSearch}
                  onChange={setAppointmentSearch}
                  placeholder="Search by patient, reason, or department"
                />
                <InlineSelect
                  label="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[{ value: "all", label: "All statuses" }, ...statuses.map((status) => ({ value: String(status.status_id), label: String(status.status_name) }))]}
                />
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "upcoming", label: "Upcoming" },
                    { id: "past", label: "Past" },
                    { id: "all", label: "All" }
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`table-tab ${appointmentView === option.id ? "table-tab-active" : ""}`}
                      onClick={() => setAppointmentView(option.id as "upcoming" | "past" | "all")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </ToolbarRow>

              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <WorkflowAppointmentCard
                    key={String(appointment.appointment_id)}
                    appointment={appointment}
                    statuses={statuses}
                    onUpdateStatus={onUpdateAppointmentStatus}
                  />
                ))}
              </div>
              {!filteredAppointments.length && (
                <EmptyStateCard
                  title="No appointments match this view"
                  body="Try another status filter or broaden your search."
                />
              )}
            </div>
          )}

          {activeTab === "availability" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
              <div className="space-y-5">
                <SectionIntro
                  title="Availability"
                  description="Define the recurring windows patients can book against in your schedule."
                />
                <div className="grid gap-4 md:grid-cols-2">
                  {availability.map((slot) => (
                    <div key={String(slot.availability_id)} className="panel rounded-3xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-700">
                            {String(slot.day_of_week)}
                          </p>
                          <p className="mt-3 text-xl font-semibold text-slate-950">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </p>
                        </div>
                        <StatusBadge status="Available" subtle />
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() =>
                            setAvailabilityForm({
                              availability_id: String(slot.availability_id),
                              day_of_week: String(slot.day_of_week),
                              start_time: String(slot.start_time).slice(0, 5),
                              end_time: String(slot.end_time).slice(0, 5)
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => void onRemoveAvailability(Number(slot.availability_id))}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {!availability.length && (
                  <EmptyStateCard
                    title="No availability entered yet."
                    body="Add recurring windows so patient booking stays aligned with your real clinic hours."
                  />
                )}
              </div>

              <div className="editor-shell self-start xl:sticky xl:top-28 xl:self-start">
                <div className="editor-header">
                  <p className="editor-kicker">Availability</p>
                  <h2 className="editor-title">
                    {availabilityForm.availability_id ? "Update availability slot" : "Add availability slot"}
                  </h2>
                  <p className="editor-copy">
                    Keep your recurring clinic hours current so appointment workflows stay predictable.
                  </p>
                </div>
                <form className="mt-5 grid gap-4" onSubmit={(event) => void onSaveAvailability(event)}>
                  <PortalField label="Day of week">
                    <select
                      className="form-input"
                      value={availabilityForm.day_of_week}
                      onChange={(event) =>
                        setAvailabilityForm((current) => ({ ...current, day_of_week: event.target.value }))
                      }
                    >
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </PortalField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PortalField label="Start time">
                      <input
                        className="form-input"
                        type="time"
                        value={availabilityForm.start_time}
                        onChange={(event) =>
                          setAvailabilityForm((current) => ({ ...current, start_time: event.target.value }))
                        }
                        required
                      />
                    </PortalField>
                    <PortalField label="End time">
                      <input
                        className="form-input"
                        type="time"
                        value={availabilityForm.end_time}
                        onChange={(event) =>
                          setAvailabilityForm((current) => ({ ...current, end_time: event.target.value }))
                        }
                        required
                      />
                    </PortalField>
                  </div>
                  <div className="editor-actions">
                    <button
                      type="button"
                      className="ghost-button justify-center"
                      onClick={() =>
                        setAvailabilityForm({
                          availability_id: "",
                          day_of_week: "Monday",
                          start_time: "09:00",
                          end_time: "17:00"
                        })
                      }
                    >
                      Clear
                    </button>
                    <button type="submit" className="primary-button justify-center" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <CalendarClock size={16} />}
                      {availabilityForm.availability_id ? "Save changes" : "Add slot"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <PanelSection title="Provider profile" description="Your current ClinicFlow provider identity and role context.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricLine label="Name" value={`Dr. ${fullName(data.profile.first_name, data.profile.last_name)}`} />
                  <MetricLine label="Department" value={String(data.profile.department_name ?? "—")} />
                  <MetricLine label="Specialty" value={String(data.profile.specialty ?? "—")} />
                  <MetricLine label="Email" value={String(data.profile.email ?? "—")} />
                  <MetricLine label="Phone" value={formatPhone(data.profile.phone)} />
                  <MetricLine label="License" value={String(data.profile.license_number ?? "—")} />
                </div>
              </PanelSection>
              <PanelSection title="Workflow summary" description="A quick look at your current provider workload.">
                <div className="grid gap-3">
                  <MetricLine label="Today’s appointments" value={String(todayAppointments.length)} />
                  <MetricLine label="Upcoming appointments" value={String(upcomingAppointments.length)} />
                  <MetricLine label="Availability windows" value={String(availability.length)} />
                  <MetricLine label="Scheduled appointments" value={String(confirmedCount)} />
                </div>
              </PanelSection>
            </div>
          )}
        </>
      )}
    </PortalShell>
  );
}

function PortalShell({
  tone,
  eyebrow,
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  onLogout,
  children
}: {
  tone: "patient" | "provider";
  eyebrow: string;
  title: string;
  subtitle: string;
  navItems: Array<{ id: string; label: string; icon: typeof HeartPulse }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const accent =
    tone === "patient"
      ? "from-blue-50 via-cyan-50 to-white"
      : "from-slate-100 via-indigo-50 to-white";
  const badgeTone = tone === "patient" ? "text-blue-700" : "text-indigo-700";

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${accent} p-5 shadow-soft`}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                <HeartPulse size={14} className={badgeTone} />
                {eyebrow}
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">{subtitle}</p>
            </div>
            <nav className="panel rounded-3xl p-3" aria-label={`${eyebrow} navigation`}>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onTabChange(item.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-white/15" : "bg-slate-100"}`}>
                        <Icon size={18} />
                      </span>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
            <button type="button" className="ghost-button w-full justify-center" onClick={onLogout}>
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </aside>

        <div className="min-w-0 space-y-5 xl:min-h-[calc(100vh-8rem)]">
          <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${accent} p-5 shadow-soft xl:hidden`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${badgeTone}`}>{eyebrow}</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h1>
                <p className="mt-2 text-sm leading-7 text-slate-600">{subtitle}</p>
              </div>
              <button type="button" className="ghost-button justify-center sm:shrink-0" onClick={onLogout}>
                <LogOut size={16} />
                Log out
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`table-tab ${activeTab === item.id ? "table-tab-active" : ""}`}
                  onClick={() => onTabChange(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

function PortalHeroCard({
  tone,
  title,
  body,
  actions,
  side
}: {
  tone: "patient" | "provider";
  title: string;
  body: string;
  actions?: ReactNode;
  side?: ReactNode;
}) {
  const iconTone = tone === "patient" ? "bg-blue-600" : "bg-indigo-600";
  return (
    <div className="panel rounded-3xl p-6 sm:p-7">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div>
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${iconTone} text-white`}>
            <HeartPulse size={20} />
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-normal text-slate-950">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{body}</p>
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {side ? <div className="grid gap-3">{side}</div> : null}
      </div>
    </div>
  );
}

function PanelSection({
  title,
  description,
  action,
  children
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="panel rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function PortalStat({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "blue" | "teal" | "emerald" | "indigo" | "rose";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    teal: "bg-teal-50 text-teal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    rose: "bg-rose-50 text-rose-700"
  } as const;
  return (
    <div className="panel rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]}`}>
          <CalendarClock size={18} />
        </span>
      </div>
    </div>
  );
}

function AppointmentCard({
  title,
  subtitle,
  meta,
  status,
  reason,
  notes,
  actions
}: {
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  reason: string;
  notes?: string;
  actions?: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold text-slate-950">{title}</h4>
            <StatusBadge status={status} />
          </div>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <p className="mt-1 text-sm text-slate-500">{meta}</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{reason}</p>
          {notes ? <p className="mt-2 text-sm leading-6 text-slate-500">{notes}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </article>
  );
}

function WorkflowAppointmentCard({
  appointment,
  statuses,
  onUpdateStatus,
  detailed = false
}: {
  appointment: ProviderRecord;
  statuses: ProviderRecord[];
  onUpdateStatus: (appointmentId: number, statusId: number, changeReason?: string) => Promise<void>;
  detailed?: boolean;
}) {
  const actionableStatuses = statuses.filter((status) => {
    const name = String(status.status_name ?? "");
    return ["Completed", "Cancelled", "No-Show", "Scheduled"].includes(name);
  });

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold text-slate-950">
              {formatTime(appointment.start_time)} • {fullName(appointment.patient_first, appointment.patient_last)}
            </h4>
            <StatusBadge status={String(appointment.status_name ?? "Scheduled")} />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {String(appointment.department_name ?? "")} • {formatDateLong(appointment.appointment_date)} • {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{String(appointment.reason ?? "General appointment")}</p>
          {detailed ? (
            <div className="mt-4 grid gap-3">
              <MetricLine label="Patient email" value={String(appointment.patient_email ?? "—")} />
              <MetricLine label="Patient phone" value={formatPhone(appointment.patient_phone)} />
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {actionableStatuses
            .filter((status) => String(status.status_id) !== String(appointment.status_id))
            .slice(0, 3)
            .map((status) => (
              <button
                key={String(status.status_id)}
                type="button"
                className="ghost-button"
                onClick={() =>
                  void onUpdateStatus(
                    Number(appointment.appointment_id),
                    Number(status.status_id),
                    `Provider marked appointment ${String(status.status_name).toLowerCase()}`
                  )
                }
              >
                Mark {String(status.status_name)}
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}

function DoctorCardTile({
  doctor,
  selected = false,
  onSelect,
  compact = false
}: {
  doctor: DoctorCard;
  selected?: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <article className={`panel rounded-3xl p-5 ${selected ? "border-blue-200 bg-blue-50/40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">
            {doctor.department_name}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            Dr. {doctor.first_name} {doctor.last_name}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{doctor.specialty}</p>
        </div>
        {selected ? <StatusBadge status="Selected" subtle /> : null}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        {doctor.availability_summary ?? "Availability not entered yet."}
      </p>
      {!compact ? (
        <button type="button" className="primary-button mt-5" onClick={onSelect}>
          <CalendarClock size={16} />
          Book appointment
        </button>
      ) : null}
    </article>
  );
}

function ProviderPreviewCard({
  doctor,
  onSelect
}: {
  doctor: DoctorCard;
  onSelect: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm font-semibold text-slate-950">
        Dr. {doctor.first_name} {doctor.last_name}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {doctor.specialty} • {doctor.department_name}
      </p>
      <button type="button" className="ghost-button mt-4" onClick={onSelect}>
        View availability
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="sr-only">Search</span>
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

function ToolbarRow({ children }: { children: ReactNode }) {
  return (
    <div className="panel rounded-3xl p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">{children}</div>
    </div>
  );
}

function InlineSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="min-w-[12rem]">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <select className="form-input w-full" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PortalField({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function StepCard({
  step,
  title,
  body,
  active = false
}: {
  step: string;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <div className={`rounded-3xl border p-4 ${active ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Step {step}</p>
      <p className="mt-3 text-base font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function StatusBadge({ status, subtle = false }: { status: string; subtle?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${subtle ? "border-slate-200 bg-slate-100 text-slate-700" : statusTone(status)}`}
    >
      {status}
    </span>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 break-words">{value}</dd>
    </div>
  );
}

function EmptyStateCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
      <h4 className="text-base font-semibold text-slate-950">{title}</h4>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="panel flex items-center gap-3 rounded-3xl p-6 text-sm text-slate-600">
      <Loader2 className="animate-spin text-blue-700" size={18} />
      {label}...
    </div>
  );
}
