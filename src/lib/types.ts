export type Role = "patient" | "provider" | "admin";
export type Gender = "male" | "female" | "other";
export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type DbRow = Record<string, string | number | boolean | null>;

export type TableKey =
  | "users"
  | "patients"
  | "providers"
  | "departments"
  | "appointments"
  | "availability"
  | "auditLog";

export type QueryDefinition = {
  id: string;
  number: string;
  title: string;
  category: "CRUD" | "Advanced";
  scenario: string;
  sql: string;
  expectedBehavior: string;
  whyJoin?: string;
  whyGroupBy?: string;
  runnable: boolean;
};

export type SessionUser = {
  userId: number;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
  patientId: number | null;
  providerId: number | null;
  departmentId: number | null;
  specialty: string | null;
};

export type DoctorCard = {
  provider_id: number;
  department_id: number;
  department_name: string;
  first_name: string;
  last_name: string;
  specialty: string;
  availability_summary: string | null;
};
