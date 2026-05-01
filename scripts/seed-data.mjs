import { withClient } from "./db.mjs";

const statusIds = {
  Scheduled: 1,
  Completed: 2,
  Cancelled: 3,
  "No-Show": 4
};

const statuses = [
  { status_id: 1, status_name: "Scheduled" },
  { status_id: 2, status_name: "Completed" },
  { status_id: 3, status_name: "Cancelled" },
  { status_id: 4, status_name: "No-Show" }
];

const departments = [
  {
    department_id: 1,
    department_name: "Primary Care",
    location: "ClinicFlow Center, Suite 110",
    phone: "509-555-1001"
  },
  {
    department_id: 2,
    department_name: "Cardiology",
    location: "ClinicFlow Center, Suite 220",
    phone: "509-555-1002"
  },
  {
    department_id: 3,
    department_name: "Pediatrics",
    location: "ClinicFlow Center, Suite 125",
    phone: "509-555-1003"
  },
  {
    department_id: 4,
    department_name: "Dermatology",
    location: "ClinicFlow Center, Suite 310",
    phone: "509-555-1004"
  },
  {
    department_id: 5,
    department_name: "Orthopedics",
    location: "ClinicFlow Center, Suite 205",
    phone: "509-555-1005"
  },
  {
    department_id: 6,
    department_name: "Women’s Health",
    location: "ClinicFlow Center, Suite 140",
    phone: "509-555-1006"
  },
  {
    department_id: 7,
    department_name: "Behavioral Health",
    location: "ClinicFlow Center, Suite 330",
    phone: "509-555-1007"
  },
  {
    department_id: 8,
    department_name: "Endocrinology",
    location: "ClinicFlow Center, Suite 245",
    phone: "509-555-1008"
  }
];

const adminUsers = [
  {
    key: "admin-primary",
    user_id: 1,
    first_name: "Admin",
    last_name: "User",
    email: "admin@hospital.com",
    password_hash: "hash5",
    phone: "509-555-0300",
    role: "admin",
    created_offset_days: -120
  },
  {
    key: "admin-ops",
    user_id: 2,
    first_name: "Nina",
    last_name: "Patel",
    email: "nina.patel@clinicflow.demo",
    password_hash: "hash_admin_ops",
    phone: "509-555-0301",
    role: "admin",
    created_offset_days: -95
  }
];

const providerSeeds = [
  {
    key: "alice-brown",
    user_id: 3,
    provider_id: 1,
    first_name: "Alice",
    last_name: "Brown",
    email: "alice.brown@email.com",
    password_hash: "hash3",
    phone: "509-555-0201",
    department_id: 2,
    specialty: "Cardiology",
    license_number: "LIC-CARD-1001",
    created_offset_days: -118,
    availability: [
      ["Monday", "08:00", "15:30"],
      ["Tuesday", "08:30", "15:30"],
      ["Thursday", "08:00", "16:00"],
      ["Friday", "08:00", "12:30"]
    ]
  },
  {
    key: "marcus-chen",
    user_id: 4,
    provider_id: 2,
    first_name: "Marcus",
    last_name: "Chen",
    email: "marcus.chen@clinicflow.demo",
    password_hash: "hash_provider_2",
    phone: "509-555-0202",
    department_id: 1,
    specialty: "Primary Care",
    license_number: "LIC-PCP-1002",
    created_offset_days: -110,
    availability: [
      ["Monday", "09:00", "17:00"],
      ["Wednesday", "09:00", "17:00"],
      ["Thursday", "09:00", "17:00"],
      ["Friday", "09:00", "15:00"],
      ["Saturday", "09:00", "13:00"]
    ]
  },
  {
    key: "priya-shah",
    user_id: 5,
    provider_id: 3,
    first_name: "Priya",
    last_name: "Shah",
    email: "priya.shah@clinicflow.demo",
    password_hash: "hash_provider_3",
    phone: "509-555-0203",
    department_id: 3,
    specialty: "Pediatrics",
    license_number: "LIC-PEDS-1003",
    created_offset_days: -108,
    availability: [
      ["Monday", "09:00", "17:00"],
      ["Tuesday", "09:00", "17:00"],
      ["Wednesday", "09:00", "17:00"],
      ["Thursday", "09:00", "14:00"],
      ["Saturday", "09:30", "13:30"]
    ]
  },
  {
    key: "elena-ramirez",
    user_id: 6,
    provider_id: 4,
    first_name: "Elena",
    last_name: "Ramirez",
    email: "elena.ramirez@clinicflow.demo",
    password_hash: "hash_provider_4",
    phone: "509-555-0204",
    department_id: 4,
    specialty: "Dermatology",
    license_number: "LIC-DERM-1004",
    created_offset_days: -104,
    availability: [
      ["Tuesday", "10:00", "18:00"],
      ["Wednesday", "10:00", "18:00"],
      ["Thursday", "10:00", "18:00"],
      ["Friday", "09:30", "16:30"]
    ]
  },
  {
    key: "daniel-kim",
    user_id: 7,
    provider_id: 5,
    first_name: "Daniel",
    last_name: "Kim",
    email: "daniel.kim@clinicflow.demo",
    password_hash: "hash_provider_5",
    phone: "509-555-0205",
    department_id: 5,
    specialty: "Orthopedics",
    license_number: "LIC-ORTH-1005",
    created_offset_days: -102,
    availability: [
      ["Monday", "08:00", "16:00"],
      ["Tuesday", "08:00", "16:00"],
      ["Thursday", "08:00", "16:00"],
      ["Saturday", "09:00", "13:00"]
    ]
  },
  {
    key: "maya-thompson",
    user_id: 8,
    provider_id: 6,
    first_name: "Maya",
    last_name: "Thompson",
    email: "maya.thompson@clinicflow.demo",
    password_hash: "hash_provider_6",
    phone: "509-555-0206",
    department_id: 6,
    specialty: "Women’s Health",
    license_number: "LIC-WH-1006",
    created_offset_days: -99,
    availability: [
      ["Tuesday", "09:00", "17:00"],
      ["Wednesday", "09:00", "17:00"],
      ["Friday", "09:00", "17:00"],
      ["Sunday", "10:00", "14:00"]
    ]
  },
  {
    key: "samuel-reed",
    user_id: 9,
    provider_id: 7,
    first_name: "Samuel",
    last_name: "Reed",
    email: "samuel.reed@clinicflow.demo",
    password_hash: "hash_provider_7",
    phone: "509-555-0207",
    department_id: 7,
    specialty: "Behavioral Health",
    license_number: "LIC-BH-1007",
    created_offset_days: -96,
    availability: [
      ["Monday", "10:00", "18:00"],
      ["Wednesday", "10:00", "18:00"],
      ["Thursday", "10:00", "18:00"],
      ["Sunday", "10:00", "14:00"]
    ]
  },
  {
    key: "hannah-patel",
    user_id: 10,
    provider_id: 8,
    first_name: "Hannah",
    last_name: "Patel",
    email: "hannah.patel@clinicflow.demo",
    password_hash: "hash_provider_8",
    phone: "509-555-0208",
    department_id: 8,
    specialty: "Endocrinology",
    license_number: "LIC-ENDO-1008",
    created_offset_days: -92,
    availability: [
      ["Tuesday", "08:00", "16:00"],
      ["Thursday", "08:00", "16:00"],
      ["Friday", "08:00", "15:00"],
      ["Sunday", "09:30", "13:30"]
    ]
  },
  {
    key: "owen-brooks",
    user_id: 11,
    provider_id: 9,
    first_name: "Owen",
    last_name: "Brooks",
    email: "owen.brooks@clinicflow.demo",
    password_hash: "hash_provider_9",
    phone: "509-555-0209",
    department_id: 1,
    specialty: "Primary Care",
    license_number: "LIC-PCP-1009",
    created_offset_days: -88,
    availability: [
      ["Monday", "08:00", "14:00"],
      ["Tuesday", "08:00", "14:00"],
      ["Wednesday", "08:00", "14:00"],
      ["Friday", "08:00", "14:00"],
      ["Saturday", "09:00", "13:00"]
    ]
  },
  {
    key: "lila-morgan",
    user_id: 12,
    provider_id: 10,
    first_name: "Lila",
    last_name: "Morgan",
    email: "lila.morgan@clinicflow.demo",
    password_hash: "hash_provider_10",
    phone: "509-555-0210",
    department_id: 2,
    specialty: "Cardiology",
    license_number: "LIC-CARD-1010",
    created_offset_days: -84,
    availability: [
      ["Wednesday", "08:30", "16:30"],
      ["Thursday", "08:30", "16:30"],
      ["Friday", "08:30", "16:00"],
      ["Sunday", "10:00", "14:00"]
    ]
  }
];

const patientSeeds = [
  ["john-doe", 13, 1, "John", "Doe", "john.doe@email.com", "hash1", "509-555-0101", "1990-05-15", "male", "Jane Doe", "509-555-0102", "BlueCross Cascade", "BCC-00101", -90],
  ["ava-martinez", 14, 2, "Ava", "Martinez", "ava.martinez@clinicflow.demo", "hash_patient_2", "509-555-0103", "1988-08-21", "female", "Luis Martinez", "509-555-1103", "Aetna Northwest", "ANW-00214", -86],
  ["noah-bennett", 15, 3, "Noah", "Bennett", "noah.bennett@clinicflow.demo", "hash_patient_3", "509-555-0104", "1979-03-11", "male", "Claire Bennett", "509-555-1104", "Regence Select", "RGS-00315", -83],
  ["sofia-collins", 16, 4, "Sofia", "Collins", "sofia.collins@clinicflow.demo", "hash_patient_4", "509-555-0105", "1994-12-07", "female", "Tara Collins", "509-555-1105", "Premera Connect", "PMC-00416", -80],
  ["mason-rivera", 17, 5, "Mason", "Rivera", "mason.rivera@clinicflow.demo", "hash_patient_5", "509-555-0106", "1986-07-30", "male", "Nina Rivera", "509-555-1106", "Cigna Summit", "CGS-00517", -77],
  ["emma-brooks", 18, 6, "Emma", "Brooks", "emma.brooks@clinicflow.demo", "hash_patient_6", "509-555-0107", "1997-02-17", "female", "Olivia Brooks", "509-555-1107", "Kaiser Evergreen", "KPE-00618", -74],
  ["liam-foster", 19, 7, "Liam", "Foster", "liam.foster@clinicflow.demo", "hash_patient_7", "509-555-0108", "1982-09-03", "male", "Mia Foster", "509-555-1108", "United Horizon", "UNH-00719", -71],
  ["olivia-nguyen", 20, 8, "Olivia", "Nguyen", "olivia.nguyen@clinicflow.demo", "hash_patient_8", "509-555-0109", "1992-10-09", "female", "Linh Nguyen", "509-555-1109", "BlueShield Coast", "BSC-00820", -68],
  ["ethan-parker", 21, 9, "Ethan", "Parker", "ethan.parker@clinicflow.demo", "hash_patient_9", "509-555-0110", "1974-04-25", "male", "Jill Parker", "509-555-1110", "Regence Select", "RGS-00921", -65],
  ["grace-simmons", 22, 10, "Grace", "Simmons", "grace.simmons@clinicflow.demo", "hash_patient_10", "509-555-0111", "2001-01-19", "female", "Mara Simmons", "509-555-1111", "Aetna Northwest", "ANW-01022", -62],
  ["lucas-perry", 23, 11, "Lucas", "Perry", "lucas.perry@clinicflow.demo", "hash_patient_11", "509-555-0112", "1989-06-13", "male", "Kelly Perry", "509-555-1112", "Premera Connect", "PMC-01123", -59],
  ["chloe-turner", 24, 12, "Chloe", "Turner", "chloe.turner@clinicflow.demo", "hash_patient_12", "509-555-0113", "1995-11-28", "female", "Aidan Turner", "509-555-1113", "Kaiser Evergreen", "KPE-01224", -56],
  ["henry-ross", 25, 13, "Henry", "Ross", "henry.ross@clinicflow.demo", "hash_patient_13", "509-555-0114", "1983-05-05", "male", "Elise Ross", "509-555-1114", "United Horizon", "UNH-01325", -53],
  ["zoe-bennett", 26, 14, "Zoe", "Bennett", "zoe.bennett@clinicflow.demo", "hash_patient_14", "509-555-0115", "2014-08-14", "female", "Noah Bennett", "509-555-1115", "Regence Family", "RGF-01426", -50],
  ["julian-price", 27, 15, "Julian", "Price", "julian.price@clinicflow.demo", "hash_patient_15", "509-555-0116", "1978-02-08", "male", "Dana Price", "509-555-1116", "BlueCross Cascade", "BCC-01527", -47],
  ["mila-carter", 28, 16, "Mila", "Carter", "mila.carter@clinicflow.demo", "hash_patient_16", "509-555-0117", "1999-03-22", "female", "Nora Carter", "509-555-1117", "Cigna Summit", "CGS-01628", -44],
  ["isaac-flores", 29, 17, "Isaac", "Flores", "isaac.flores@clinicflow.demo", "hash_patient_17", "509-555-0118", "1991-12-01", "male", "Dalia Flores", "509-555-1118", "BlueShield Coast", "BSC-01729", -41],
  ["layla-hughes", 30, 18, "Layla", "Hughes", "layla.hughes@clinicflow.demo", "hash_patient_18", "509-555-0119", "1987-09-27", "female", "Aaron Hughes", "509-555-1119", "Aetna Northwest", "ANW-01830", -38],
  ["caleb-morris", 31, 19, "Caleb", "Morris", "caleb.morris@clinicflow.demo", "hash_patient_19", "509-555-0120", "1976-01-16", "male", "Lena Morris", "509-555-1120", "United Horizon", "UNH-01931", -35],
  ["nora-patel", 32, 20, "Nora", "Patel", "nora.patel@clinicflow.demo", "hash_patient_20", "509-555-0121", "2003-04-18", "female", "Priya Patel", "509-555-1121", "Kaiser Evergreen", "KPE-02032", -32],
  ["ruby-edwards", 33, 21, "Ruby", "Edwards", "ruby.edwards@clinicflow.demo", "hash_patient_21", "509-555-0122", "2011-07-06", "female", "Jamie Edwards", "509-555-1122", "Regence Family", "RGF-02133", -29],
  ["leo-jenkins", 34, 22, "Leo", "Jenkins", "leo.jenkins@clinicflow.demo", "hash_patient_22", "509-555-0123", "1969-10-29", "male", "Erin Jenkins", "509-555-1123", "Premera Connect", "PMC-02234", -26],
  ["ivy-sanders", 35, 23, "Ivy", "Sanders", "ivy.sanders@clinicflow.demo", "hash_patient_23", "509-555-0124", "1996-06-10", "female", "Milo Sanders", "509-555-1124", "BlueShield Coast", "BSC-02335", -23],
  ["miles-cooper", 36, 24, "Miles", "Cooper", "miles.cooper@clinicflow.demo", "hash_patient_24", "509-555-0125", "1984-11-12", "male", "Tessa Cooper", "509-555-1125", "Cigna Summit", "CGS-02436", -20]
].map(
  ([
    key,
    user_id,
    patient_id,
    first_name,
    last_name,
    email,
    password_hash,
    phone,
    date_of_birth,
    gender,
    emergency_contact_name,
    emergency_contact_phone,
    insurance_provider,
    insurance_policy_number,
    created_offset_days
  ]) => ({
    key,
    user_id,
    patient_id,
    first_name,
    last_name,
    email,
    password_hash,
    phone,
    date_of_birth,
    gender,
    emergency_contact_name,
    emergency_contact_phone,
    insurance_provider,
    insurance_policy_number,
    role: "patient",
    created_offset_days
  })
);

const dayOrder = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const DEMO_TODAY = new Date("2026-05-01T12:00:00");
const SEEDED_ACTIVITY_CUTOFF = new Date("2026-04-30T23:59:00");

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timestampFor(date, time, daysOffset = 0) {
  const [hours, minutes] = time.split(":").map(Number);
  const stamp = addDays(date, daysOffset);
  stamp.setHours(hours, minutes, 0, 0);
  return stamp;
}

function normalizeToday() {
  const today = new Date(DEMO_TODAY);
  today.setHours(12, 0, 0, 0);
  return today;
}

function clampBeforeSeedCutoff(stamp, minutesBeforeCutoff = 0) {
  if (stamp.getTime() <= SEEDED_ACTIVITY_CUTOFF.getTime()) {
    return stamp;
  }
  return new Date(SEEDED_ACTIVITY_CUTOFF.getTime() - minutesBeforeCutoff * 60 * 1000);
}

function nextDateForDay(dayName, occurrence = 0, fromDate = normalizeToday()) {
  const target = dayOrder.indexOf(dayName);
  const cursor = new Date(fromDate);
  cursor.setHours(12, 0, 0, 0);
  let found = 0;
  while (found <= occurrence) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === target) {
      if (found === occurrence) return new Date(cursor);
      found += 1;
    }
  }
  return new Date(cursor);
}

function previousDateForDay(dayName, occurrence = 0, fromDate = normalizeToday()) {
  const target = dayOrder.indexOf(dayName);
  const cursor = new Date(fromDate);
  cursor.setHours(12, 0, 0, 0);
  let found = 0;
  while (found <= occurrence) {
    cursor.setDate(cursor.getDate() - 1);
    if (cursor.getDay() === target) {
      if (found === occurrence) return new Date(cursor);
      found += 1;
    }
  }
  return new Date(cursor);
}

function pickProviderDate(provider, mode, occurrence = 0, fromDate = normalizeToday()) {
  const days = provider.availability.map(([day]) => day);
  const candidates = [];
  const cursor = new Date(fromDate);
  cursor.setHours(12, 0, 0, 0);
  for (let offset = mode === "past" ? -1 : 0; Math.abs(offset) <= 45; offset += mode === "past" ? -1 : 1) {
    const candidate = addDays(cursor, offset);
    const dayName = dayOrder[candidate.getDay()];
    if (days.includes(dayName)) {
      if (mode === "today" && offset !== 0) continue;
      if (mode === "future" && offset <= 0) continue;
      if (mode === "past" && offset >= 0) continue;
      candidates.push(new Date(candidate));
    }
  }
  if (!candidates.length) {
    throw new Error(`Unable to find a ${mode} date for provider ${provider.key}.`);
  }
  return candidates[Math.min(occurrence, candidates.length - 1)];
}

function timeRangeForProvider(provider, dayName, fallbackStart) {
  const availability = provider.availability.find(([day]) => day === dayName);
  if (!availability) throw new Error(`Provider ${provider.key} is not available on ${dayName}.`);
  return { start: availability[1], end: availability[2], fallbackStart };
}

function minutesFromTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildSeedData() {
  const today = normalizeToday();
  const users = [...adminUsers];
  const patients = [];
  const providers = [];
  const availability = [];
  const appointments = [];
  const auditLogs = [];

  for (const provider of providerSeeds) {
    users.push({
      user_id: provider.user_id,
      first_name: provider.first_name,
      last_name: provider.last_name,
      email: provider.email,
      password_hash: provider.password_hash,
      phone: provider.phone,
      role: "provider",
      created_offset_days: provider.created_offset_days
    });
    providers.push({
      provider_id: provider.provider_id,
      user_id: provider.user_id,
      department_id: provider.department_id,
      specialty: provider.specialty,
      license_number: provider.license_number
    });
  }

  for (const patient of patientSeeds) {
    users.push({
      user_id: patient.user_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      password_hash: patient.password_hash,
      phone: patient.phone,
      role: "patient",
      created_offset_days: patient.created_offset_days
    });
    patients.push({
      patient_id: patient.patient_id,
      user_id: patient.user_id,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone,
      insurance_provider: patient.insurance_provider,
      insurance_policy_number: patient.insurance_policy_number
    });
  }

  let availabilityId = 1;
  for (const provider of providerSeeds) {
    for (const [day_of_week, start_time, end_time] of provider.availability) {
      availability.push({
        availability_id: availabilityId++,
        provider_id: provider.provider_id,
        day_of_week,
        start_time,
        end_time
      });
    }
  }

  const providerByKey = Object.fromEntries(providerSeeds.map((provider) => [provider.key, provider]));
  const patientByKey = Object.fromEntries(patientSeeds.map((patient) => [patient.key, patient]));
  const userByKey = Object.fromEntries(
    [
      ...adminUsers.map((user) => [user.key, user]),
      ...providerSeeds.map((provider) => [provider.key, provider]),
      ...patientSeeds.map((patient) => [patient.key, patient])
    ]
  );

  const slotTracker = new Map();
  let appointmentId = 1;
  let logId = 1;

  function reserveAppointment({
    patientKey,
    providerKey,
    mode,
    occurrence = 0,
    explicitDate = null,
    start_time,
    durationMinutes = 30,
    status_name,
    reason,
    notes = null,
    createdByKey = "admin-primary",
    statusChangedByKey = null,
    change_reason = null,
    createdDaysBefore = 7
  }) {
    const provider = providerByKey[providerKey];
    const patient = patientByKey[patientKey];
    if (!provider || !patient) {
      throw new Error(`Unknown patient/provider combination: ${patientKey} / ${providerKey}`);
    }

    const appointmentDate = explicitDate
      ? new Date(explicitDate)
      : pickProviderDate(provider, mode, occurrence, today);
    const dayName = dayOrder[appointmentDate.getUTCDay()];
    const slot = timeRangeForProvider(provider, dayName, start_time);
    const startMinutes = minutesFromTime(start_time ?? slot.fallbackStart);
    const endMinutes = startMinutes + durationMinutes;
    const availableStart = minutesFromTime(slot.start);
    const availableEnd = minutesFromTime(slot.end);
    if (startMinutes < availableStart || endMinutes > availableEnd) {
      throw new Error(`Appointment for ${providerKey} is outside availability on ${dayName}.`);
    }

    const appointment_date = isoDate(appointmentDate);
    const normalizedStart = timeFromMinutes(startMinutes);
    const normalizedEnd = timeFromMinutes(endMinutes);
    const trackerKey = `${provider.provider_id}:${appointment_date}`;
    const slots = slotTracker.get(trackerKey) ?? [];
    for (const existing of slots) {
      if (startMinutes < existing.end && existing.start < endMinutes) {
        throw new Error(`Overlapping slot detected for provider ${providerKey} on ${appointment_date}.`);
      }
    }
    slots.push({ start: startMinutes, end: endMinutes });
    slotTracker.set(trackerKey, slots);

    const appointmentIdValue = appointmentId++;
    const createdAt = clampBeforeSeedCutoff(
      timestampFor(appointmentDate, normalizedStart, -Math.max(createdDaysBefore, 1)),
      appointmentIdValue * 17 + 45
    );
    const appointment = {
      appointment_id: appointmentIdValue,
      patient_id: patient.patient_id,
      provider_id: provider.provider_id,
      department_id: provider.department_id,
      status_id: statusIds[status_name],
      appointment_date,
      start_time: normalizedStart,
      end_time: normalizedEnd,
      reason,
      notes,
      created_at: createdAt
    };
    appointments.push(appointment);

    const createdBy = userByKey[createdByKey];
    auditLogs.push({
      log_id: logId++,
      appointment_id: appointment.appointment_id,
      changed_by: createdBy.user_id,
      old_status_id: null,
      new_status_id: statusIds.Scheduled,
      change_timestamp: createdAt,
      change_reason: change_reason ?? "Appointment created for local demo workflow."
    });

    if (status_name !== "Scheduled") {
      const statusChangedBy = userByKey[statusChangedByKey ?? createdByKey];
      const statusChangeTimestamp = clampBeforeSeedCutoff(
        mode === "future"
          ? timestampFor(appointmentDate, normalizedStart, -1)
          : timestampFor(appointmentDate, normalizedEnd, 0),
        appointment.appointment_id * 17 + 5
      );
      auditLogs.push({
        log_id: logId++,
        appointment_id: appointment.appointment_id,
        changed_by: statusChangedBy.user_id,
        old_status_id: statusIds.Scheduled,
        new_status_id: statusIds[status_name],
        change_timestamp: statusChangeTimestamp,
        change_reason:
          change_reason ??
          (status_name === "Completed"
            ? "Visit completed and clinical notes recorded."
            : status_name === "Cancelled"
              ? "Patient changed plans and the visit was cancelled."
              : "Patient did not arrive for the scheduled visit.")
      });
    }
  }

  const todayProviders = providerSeeds.filter((provider) =>
    provider.availability.some(([day]) => day === dayOrder[today.getUTCDay()])
  );
  const todayPairs = [
    ["ava-martinez", todayProviders[0]?.key ?? "marcus-chen", "09:00", "Annual checkup"],
    ["olivia-nguyen", todayProviders[1]?.key ?? "alice-brown", "10:00", "Cardiology follow-up"],
    ["leo-jenkins", todayProviders[2]?.key ?? "samuel-reed", "11:00", "Medication review"],
    ["mila-carter", todayProviders[3]?.key ?? "maya-thompson", "13:30", "Follow-up consultation"]
  ];

  for (const [patientKey, providerKey, start_time, reason] of todayPairs) {
    reserveAppointment({
      patientKey,
      providerKey,
      mode: "today",
      start_time,
      status_name: "Scheduled",
      reason,
      createdByKey: patientKey,
      createdDaysBefore: 2
    });
  }

  const specs = [
    ["john-doe", "alice-brown", "future", 0, "09:00", 30, "Scheduled", "Cardiology follow-up", null, "john-doe", null, "Patient booked a follow-up after reviewing recent symptoms.", 5],
    ["john-doe", "marcus-chen", "past", 0, "10:30", 30, "Completed", "Annual checkup", "Blood pressure improved after medication changes.", "admin-primary", "marcus-chen", "Annual primary care visit completed.", 18],
    ["john-doe", "alice-brown", "future", 1, "11:00", 30, "Cancelled", "Lab results review", "Patient opted to review results at the next cardiology visit.", "john-doe", "john-doe", "Patient requested a later review window after travel changed.", 4],
    ["john-doe", "hannah-patel", "future", 2, "14:00", 30, "Scheduled", "Medication review", null, "john-doe", null, "Endocrinology medication review booked from the patient portal.", 6],

    ["ava-martinez", "marcus-chen", "future", 1, "09:30", 30, "Scheduled", "New patient visit", null, "ava-martinez", null, "New patient onboarding visit scheduled.", 8],
    ["noah-bennett", "alice-brown", "past", 1, "08:30", 45, "Completed", "Cardiology follow-up", "Stress test reviewed and no new concerns were noted.", "admin-primary", "alice-brown", "Provider closed the follow-up after discussing test results.", 20],
    ["sofia-collins", "maya-thompson", "future", 0, "10:00", 45, "Scheduled", "Women’s wellness visit", null, "sofia-collins", null, "Annual wellness appointment booked online.", 7],
    ["mason-rivera", "daniel-kim", "future", 0, "09:00", 45, "Scheduled", "Orthopedic evaluation", null, "mason-rivera", null, "Knee pain evaluation scheduled after referral.", 9],
    ["emma-brooks", "priya-shah", "future", 0, "09:30", 30, "Scheduled", "Pediatric wellness visit", null, "emma-brooks", null, "Parent scheduled a school-year wellness visit.", 6],
    ["liam-foster", "samuel-reed", "future", 0, "10:30", 50, "Scheduled", "Behavioral health consultation", null, "liam-foster", null, "Behavioral health intake scheduled.", 10],
    ["olivia-nguyen", "elena-ramirez", "future", 0, "10:30", 30, "Scheduled", "Dermatology screening", null, "olivia-nguyen", null, "Annual skin screening booked after reminder outreach.", 5],
    ["ethan-parker", "hannah-patel", "future", 0, "09:30", 30, "Scheduled", "Lab results review", null, "ethan-parker", null, "Follow-up visit scheduled after labs posted to the portal.", 6],
    ["grace-simmons", "owen-brooks", "future", 0, "09:30", 30, "Scheduled", "Medication review", null, "grace-simmons", null, "Medication review scheduled during phone triage.", 4],
    ["lucas-perry", "lila-morgan", "future", 0, "10:30", 30, "Scheduled", "Heart rhythm review", null, "lucas-perry", null, "Cardiology follow-up added after monitoring alert.", 4],
    ["chloe-turner", "marcus-chen", "future", 2, "13:30", 30, "Scheduled", "Follow-up consultation", null, "chloe-turner", null, "Primary care follow-up scheduled from previous visit.", 7],
    ["henry-ross", "daniel-kim", "past", 0, "11:00", 45, "Completed", "Orthopedic evaluation", "Exercises prescribed for shoulder mobility improvement.", "admin-primary", "daniel-kim", "Orthopedic evaluation completed with treatment plan.", 15],
    ["zoe-bennett", "priya-shah", "past", 0, "11:00", 30, "Completed", "Pediatric wellness visit", "Immunization record updated and school forms signed.", "admin-primary", "priya-shah", "Pediatric wellness visit completed and chart updated.", 12],
    ["julian-price", "alice-brown", "future", 3, "09:30", 30, "Scheduled", "Cardiology follow-up", null, "julian-price", null, "Follow-up booked to review blood pressure trends.", 10],
    ["mila-carter", "maya-thompson", "future", 1, "11:00", 30, "Scheduled", "Annual checkup", null, "mila-carter", null, "Preventive care visit scheduled from reminder campaign.", 8],
    ["isaac-flores", "samuel-reed", "past", 1, "13:00", 50, "Completed", "Behavioral health consultation", "Patient engaged well and requested a check-in next month.", "admin-primary", "samuel-reed", "Behavioral health follow-up closed after provider documentation.", 14],
    ["layla-hughes", "elena-ramirez", "past", 0, "14:00", 30, "Completed", "Dermatology screening", "Routine skin screening completed without urgent findings.", "admin-primary", "elena-ramirez", "Dermatology screening completed successfully.", 11],
    ["caleb-morris", "hannah-patel", "past", 1, "09:30", 30, "No-Show", "Diabetes management follow-up", "Patient missed the visit and outreach was requested.", "admin-primary", "admin-primary", "Patient did not arrive for the scheduled endocrinology follow-up.", 10],
    ["nora-patel", "owen-brooks", "future", 1, "10:30", 30, "Scheduled", "New patient visit", null, "nora-patel", null, "New patient primary care visit booked online.", 6],
    ["ruby-edwards", "priya-shah", "future", 1, "10:30", 30, "Scheduled", "Pediatric wellness visit", null, "ruby-edwards", null, "Wellness visit booked before sports season.", 6],
    ["leo-jenkins", "marcus-chen", "past", 1, "11:00", 30, "Completed", "Medication review", "Medication timing adjusted after discussion of side effects.", "admin-primary", "marcus-chen", "Medication review completed with updated plan.", 13],
    ["ivy-sanders", "maya-thompson", "past", 0, "14:00", 30, "Completed", "Women’s wellness visit", "Preventive screening completed and next annual visit recommended.", "admin-primary", "maya-thompson", "Provider completed preventive wellness visit.", 9],
    ["miles-cooper", "daniel-kim", "future", 2, "10:00", 45, "Scheduled", "Orthopedic evaluation", null, "miles-cooper", null, "Referral-driven orthopedic evaluation booked.", 7],
    ["ava-martinez", "owen-brooks", "past", 0, "09:00", 30, "Completed", "Lab results review", "Discussed normal cholesterol panel and next preventive steps.", "admin-primary", "owen-brooks", "Lab review completed and follow-up deferred to annual visit.", 8],
    ["olivia-nguyen", "elena-ramirez", "future", 2, "15:00", 30, "Scheduled", "Dermatology screening", null, "olivia-nguyen", null, "Follow-up skin screening scheduled before summer travel.", 4],
    ["ethan-parker", "lila-morgan", "future", 1, "10:30", 30, "Scheduled", "Heart rhythm review", null, "ethan-parker", null, "Second-opinion cardiology review booked from referral queue.", 7],
    ["grace-simmons", "hannah-patel", "past", 0, "10:00", 30, "Completed", "Lab results review", "Reviewed thyroid panel and continued current medication dose.", "admin-primary", "hannah-patel", "Endocrinology labs reviewed with stable plan.", 10],
    ["lucas-perry", "alice-brown", "future", 2, "10:30", 30, "Scheduled", "Follow-up consultation", null, "lucas-perry", null, "Follow-up visit scheduled after discharge summary review.", 6],
    ["chloe-turner", "marcus-chen", "past", 0, "14:00", 30, "Completed", "Follow-up consultation", "Symptoms improving and no escalation needed.", "admin-primary", "marcus-chen", "Primary care follow-up completed.", 8],
    ["henry-ross", "samuel-reed", "future", 1, "15:00", 50, "Scheduled", "Behavioral health consultation", null, "henry-ross", null, "Behavioral health check-in scheduled after care coordination outreach.", 5],
    ["julian-price", "alice-brown", "past", 2, "08:00", 30, "No-Show", "Cardiology follow-up", "Patient missed the visit after travel delays.", "admin-primary", "admin-primary", "Patient missed the scheduled cardiology follow-up.", 16],
    ["mila-carter", "maya-thompson", "past", 1, "09:30", 30, "Completed", "Women’s wellness visit", "Preventive care reviewed and portal follow-up sent.", "admin-primary", "maya-thompson", "Wellness visit completed with post-visit summary sent.", 11],
    ["isaac-flores", "marcus-chen", "future", 3, "12:30", 30, "Cancelled", "Medication review", "Patient requested a later appointment after work travel changed.", "isaac-flores", "isaac-flores", "Patient cancelled after a schedule conflict and will rebook.", 3]
  ];

  for (const [
    patientKey,
    providerKey,
    mode,
    occurrence,
    start_time,
    durationMinutes,
    status_name,
    reason,
    notes,
    createdByKey,
    statusChangedByKey,
    change_reason,
    createdDaysBefore
  ] of specs) {
    reserveAppointment({
      patientKey,
      providerKey,
      mode,
      occurrence,
      start_time,
      durationMinutes,
      status_name,
      reason,
      notes,
      createdByKey,
      statusChangedByKey,
      change_reason,
      createdDaysBefore
    });
  }

  return {
    users,
    patients,
    providers,
    availability,
    appointments,
    auditLogs
  };
}

async function clearDemoData(client) {
  await client.query(`
    TRUNCATE TABLE
      APPOINTMENT_AUDIT_LOG,
      APPOINTMENT,
      PROVIDER_AVAILABILITY,
      PROVIDER,
      PATIENT,
      DEPARTMENT,
      APPOINTMENT_STATUS,
      "USER"
    RESTART IDENTITY CASCADE
  `);
}

export async function seedDatabase() {
  const data = buildSeedData();

  await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL clinicflow.seed_mode = 'on'");
      await clearDemoData(client);

      for (const status of statuses) {
        await client.query(
          `INSERT INTO APPOINTMENT_STATUS (status_id, status_name) VALUES ($1, $2)`,
          [status.status_id, status.status_name]
        );
      }

      for (const department of departments) {
        await client.query(
          `INSERT INTO DEPARTMENT (department_id, department_name, location, phone)
           VALUES ($1, $2, $3, $4)`,
          [
            department.department_id,
            department.department_name,
            department.location,
            department.phone
          ]
        );
      }

      for (const user of data.users) {
        await client.query(
          `INSERT INTO "USER"
           (user_id, first_name, last_name, email, password_hash, phone, role, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            user.user_id,
            user.first_name,
            user.last_name,
            user.email,
            user.password_hash,
            user.phone,
            user.role,
            timestampFor(normalizeToday(), "09:00", user.created_offset_days)
          ]
        );
      }

      for (const patient of data.patients) {
        await client.query(
          `INSERT INTO PATIENT
           (patient_id, user_id, date_of_birth, gender, emergency_contact_name,
            emergency_contact_phone, insurance_provider, insurance_policy_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            patient.patient_id,
            patient.user_id,
            patient.date_of_birth,
            patient.gender,
            patient.emergency_contact_name,
            patient.emergency_contact_phone,
            patient.insurance_provider,
            patient.insurance_policy_number
          ]
        );
      }

      for (const provider of data.providers) {
        await client.query(
          `INSERT INTO PROVIDER
           (provider_id, user_id, department_id, specialty, license_number)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            provider.provider_id,
            provider.user_id,
            provider.department_id,
            provider.specialty,
            provider.license_number
          ]
        );
      }

      for (const row of data.availability) {
        await client.query(
          `INSERT INTO PROVIDER_AVAILABILITY
           (availability_id, provider_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            row.availability_id,
            row.provider_id,
            row.day_of_week,
            row.start_time,
            row.end_time
          ]
        );
      }

      for (const appointment of data.appointments) {
        await client.query(
          `INSERT INTO APPOINTMENT
           (appointment_id, patient_id, provider_id, department_id, status_id,
            appointment_date, start_time, end_time, reason, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            appointment.appointment_id,
            appointment.patient_id,
            appointment.provider_id,
            appointment.department_id,
            appointment.status_id,
            appointment.appointment_date,
            appointment.start_time,
            appointment.end_time,
            appointment.reason,
            appointment.notes,
            appointment.created_at
          ]
        );
      }

      for (const log of data.auditLogs) {
        await client.query(
          `INSERT INTO APPOINTMENT_AUDIT_LOG
           (log_id, appointment_id, changed_by, old_status_id, new_status_id, change_timestamp, change_reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            log.log_id,
            log.appointment_id,
            log.changed_by,
            log.old_status_id,
            log.new_status_id,
            log.change_timestamp,
            log.change_reason
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });

  return {
    users: data.users.length,
    providers: data.providers.length,
    patients: data.patients.length,
    appointments: data.appointments.length,
    departments: departments.length,
    availability: data.availability.length,
    auditLogs: data.auditLogs.length
  };
}
