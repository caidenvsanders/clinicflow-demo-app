"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  type LucideIcon,
  Menu,
  MonitorSmartphone,
  Shield,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  X
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

const sectionLinks = [
  { label: "Home", href: "#home" },
  { label: "Patients", href: "#patients" },
  { label: "Providers", href: "#providers" },
  { label: "Admins", href: "#admins" },
  { label: "Features", href: "#features" }
];

const patientCards = [
  {
    icon: UserRound,
    title: "Find the right doctor",
    text: "Browse specialties, compare availability, and quickly identify the best fit for your visit."
  },
  {
    icon: CalendarClock,
    title: "Book appointments",
    text: "Choose a time that works and confirm visits in a workflow designed to feel simple and reliable."
  },
  {
    icon: ClipboardList,
    title: "Manage upcoming visits",
    text: "Review appointment details, keep track of what is scheduled, and stay ready for the next step."
  }
];

const providerCards = [
  {
    icon: CalendarClock,
    title: "Today's schedule",
    text: "See your upcoming day at a glance with appointment timing and a clear view of availability."
  },
  {
    icon: HeartPulse,
    title: "Patient visit details",
    text: "Review the key context for each appointment so the day stays organized and focused."
  },
  {
    icon: CheckCircle2,
    title: "Appointment updates",
    text: "Track scheduling changes and keep recurring availability aligned with real clinic operations."
  }
];

const featureGrid = [
  { icon: Stethoscope, title: "Doctor browsing", text: "Explore providers, specialties, and open time windows." },
  { icon: CalendarClock, title: "Appointment scheduling", text: "Book, review, reschedule, and manage visit timing." },
  { icon: ClipboardList, title: "Provider schedules", text: "Keep daily schedules and recurring availability easy to review." },
  { icon: Shield, title: "Admin console", text: "Access clinic operations, reporting, CRUD tools, and validation workflows." },
  { icon: ShieldCheck, title: "Secure account access", text: "Support patient, provider, and admin experiences from one platform." },
  { icon: MonitorSmartphone, title: "Responsive experience", text: "Move smoothly between desktop, tablet, and mobile layouts." }
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-ink">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-clinic-sky text-blue-700">
              <HeartPulse size={20} />
            </span>
            <span className="flex flex-col">
              <span>ClinicFlow</span>
              <span className="text-xs font-medium text-slate-500">Healthcare platform</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {sectionLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/sign-in" className="ghost-button">
              Sign in
            </Link>
            <Link href="/get-started" className="primary-button">
              Get started
            </Link>
          </div>

          <button
            type="button"
            className="icon-button lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-nav" className="border-t border-slate-200 bg-white lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 px-4 py-4 sm:px-6">
              {sectionLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 sm:grid-cols-2">
                <Link href="/sign-in" className="ghost-button justify-center" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
                <Link href="/get-started" className="primary-button justify-center" onClick={() => setMenuOpen(false)}>
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <section
        id="home"
        className="scroll-mt-24 border-b border-slate-200 bg-[linear-gradient(180deg,rgba(224,242,254,0.85),rgba(247,250,252,0.2)_52%,rgba(247,250,252,1))]"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Healthcare scheduling platform</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-ink sm:text-5xl lg:text-6xl">
              Book care, manage appointments, and run the clinic from one app.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Patients can find the right doctor and schedule visits. Providers can manage their day. Admins can keep clinic operations running smoothly.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/get-started" className="primary-button justify-center sm:justify-start">
                Get started
              </Link>
              <Link href="/sign-in" className="ghost-button justify-center sm:justify-start">
                Sign in
              </Link>
              <a href="#features" className="inline-flex min-h-10 items-center justify-center text-sm font-semibold text-blue-700 transition hover:text-blue-800 sm:justify-start">
                Explore features
              </a>
            </div>
            <dl className="mt-10 grid gap-4 sm:grid-cols-3">
              <Stat label="Patient booking" value="Doctor search + visits" />
              <Stat label="Provider workflows" value="Schedules + updates" />
              <Stat label="Operations" value="Console + reporting" />
            </dl>
          </div>

          <div className="relative min-h-[400px] sm:min-h-[460px]">
            <div className="panel relative overflow-hidden p-5 sm:p-7">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Clinic operations overview</p>
                  <p className="mt-1 text-sm text-slate-500">Today&apos;s appointments, provider workload, and patient activity.</p>
                </div>
                <div className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  System online
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <MetricCard label="Appointments" value="28" tone="blue" />
                <MetricCard label="Providers on duty" value="12" tone="teal" />
                <MetricCard label="Pending updates" value="4" tone="amber" />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Today&apos;s schedule</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Live view</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <ScheduleRow time="09:00" title="Annual checkup" meta="Dr. Alice Brown • Cardiology" />
                    <ScheduleRow time="10:30" title="Provider availability review" meta="Operations console • Admin" />
                    <ScheduleRow time="13:15" title="Wellness visit" meta="Dr. Bob Lee • Pediatrics" />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Upcoming actions</p>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <ListItem>Patients can review doctor availability before booking.</ListItem>
                    <ListItem>Providers keep recurring schedule windows current.</ListItem>
                    <ListItem>Admins validate records and operational queries.</ListItem>
                  </ul>
                </div>
              </div>
            </div>

            <div className="absolute -left-3 top-10 hidden w-60 rounded-lg border border-blue-100 bg-white p-4 shadow-soft lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Doctor profile</p>
              <p className="mt-3 text-base font-semibold text-slate-900">Dr. Alice Brown</p>
              <p className="mt-1 text-sm text-slate-600">Cardiology • Monday, Wednesday, Friday</p>
              <p className="mt-4 text-sm text-slate-500">Patients can compare specialties and book based on real availability.</p>
            </div>

            <div className="absolute -bottom-5 right-4 hidden w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-soft lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Appointment flow</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span>Patient request</span>
                  <span className="font-semibold text-slate-900">Confirmed</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span>Provider schedule</span>
                  <span className="font-semibold text-slate-900">Updated</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span>Admin oversight</span>
                  <span className="font-semibold text-slate-900">Visible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="patients" className="scroll-mt-24 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Patients"
            title="A calmer way for patients to find care and keep appointments on track."
            body="Patients can browse doctors, view availability, and book appointments without losing sight of the details that matter."
            action={{ href: "/get-started", label: "Create patient account" }}
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {patientCards.map((card) => (
              <PersonaCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      <section id="providers" className="scroll-mt-24 border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Providers"
            title="A provider experience that keeps the day organized without extra friction."
            body="Providers can review schedules, manage appointments, and stay aligned with patient demand from a responsive workspace."
            action={{ href: "/sign-in", label: "Provider sign in" }}
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {providerCards.map((card) => (
              <PersonaCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      <section id="admins" className="scroll-mt-24 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Admins</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
                Operational access stays available without taking over the product story.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                Admins can access the full operational console for dashboards, validation, record management, advanced queries, and demo workflows.
              </p>
              <Link href="/admin/sign-in" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800">
                Admin sign in
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <SubtleFeature title="Dashboard oversight" text="Monitor appointments, departments, and status changes in one place." />
              <SubtleFeature title="Record controls" text="Work with CRUD tools for healthcare scheduling data across the system." />
              <SubtleFeature title="Validation workflows" text="Review edge cases, queries, and operational rules without leaving the app." />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Features"
            title="Everything needed to support booking, care coordination, and clinic operations."
            body="The platform brings patient self-service, provider schedule visibility, and admin workflows together in a consistent experience."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureGrid.map((feature) => (
              <FeatureTile key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,rgba(224,242,254,0.65),rgba(255,255,255,1))] px-5 py-8 shadow-soft sm:px-10 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Ready to simplify clinic scheduling?</p>
            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
                  Ready to simplify clinic scheduling?
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Create an account to book visits, review provider schedules, or sign in to continue managing clinic operations.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/get-started" className="primary-button justify-center">
                  Create an account
                </Link>
                <Link href="/sign-in" className="ghost-button justify-center">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
  action
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">{title}</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">{body}</p>
      </div>
      {action && (
        <Link href={action.href} className="primary-button">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function PersonaCard({
  icon: Icon,
  title,
  text
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <article className="panel p-6">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-clinic-sky text-blue-700">
        <Icon size={20} />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
    </article>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  text
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <article className="panel p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
        </div>
      </div>
    </article>
  );
}

function SubtleFeature({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
    </article>
  );
}

function MetricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "blue" | "teal" | "amber";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-blue-50 text-blue-800"
      : tone === "teal"
        ? "bg-emerald-50 text-emerald-800"
        : "bg-amber-50 text-amber-800";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ScheduleRow({
  time,
  title,
  meta
}: {
  time: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-md border border-slate-200 bg-white px-3 py-3">
      <div className="text-sm font-semibold text-slate-900">{time}</div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{meta}</p>
      </div>
    </div>
  );
}

function ListItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
        <CheckCircle2 size={14} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-soft">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
