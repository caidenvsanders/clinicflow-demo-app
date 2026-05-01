# Healthcare Appointment Scheduling System Demo Script

## Slide 1: Healthcare Appointment Scheduling System
Hello, my name is Caiden Sanders, and this is our Sprint 2 demo for the Healthcare Appointment Scheduling System. Our team is Caiden Sanders and Vsevolod Kovalev.

For Sprint 2, our goal was to move from database design into a working implementation. We needed to prove that our system can store healthcare scheduling data, enforce business rules, reject invalid data, support CRUD operations, run advanced retrieval queries, and demonstrate those behaviors through a live UI.

The system is built around healthcare appointments. It tracks users, patients, providers, departments, appointment statuses, provider availability, appointments, and audit log entries.

## Slide 2: Sprint 2 Objectives
This slide summarizes the major objectives of the sprint.

First, we implemented the healthcare scheduling database in SQL. That includes CREATE TABLE statements, primary keys, foreign keys, NOT NULL constraints, UNIQUE constraints, CHECK constraints, and ON DELETE and ON UPDATE rules.

Second, we needed to show business rule enforcement. For example, appointment times must be valid, emails must be unique, provider license numbers must be unique, and appointments must reference valid patients, providers, departments, and statuses.

Third, we built a live UI so that the database can be demonstrated visually. The UI supports CRUD workflows, advanced JOIN queries, normalization evidence, and edge-case validation.

Finally, the system demonstrates realistic failure handling: duplicate data, invalid references, unsafe deletions, invalid updates, and conflicting provider bookings.

## Slide 3: Kanban Board Walkthrough
This slide shows the Sprint 2 Kanban board.

The Planned column includes work like defining the Sprint 2 scope, normalizing the schema, and preparing the demo video flow. These were the planning tasks that mapped the assignment requirements into concrete deliverables.

The In Progress column captures validation and presentation polish. This represents the part of the sprint where we checked that the database, UI, screenshots, and speaker notes all lined up with the final demo.

The Completed column shows the main sprint outcomes: PostgreSQL schema, seed data and SQL queries, the admin demo UI, and validation checks. This is useful for the video because it gives a clear project-management view before we move into the technical demo.

The most important takeaway from the board is that our sprint was organized around assignment requirements, not just coding tasks.

## Slide 4: Database Design
This slide describes the final database design.

The core tables are USER, PATIENT, PROVIDER, DEPARTMENT, APPOINTMENT_STATUS, APPOINTMENT, PROVIDER_AVAILABILITY, and APPOINTMENT_AUDIT_LOG.

USER stores shared account information, such as name, email, phone, password hash, role, and created timestamp. PATIENT and PROVIDER extend USER with role-specific information. This avoids duplicating account data in multiple places.

APPOINTMENT is the core transaction table. It links a patient, provider, department, and status using foreign keys. It also stores the appointment date, start time, end time, reason, notes, and created timestamp.

PROVIDER_AVAILABILITY is separate from APPOINTMENT because availability is an independent recurring fact. APPOINTMENT_AUDIT_LOG is also separate because an appointment can have many status-change events over time.

## Slide 5: Constraints and Business Rules
This slide explains how the database enforces business rules.

UNIQUE constraints protect natural identifiers. For example, USER.email must be unique, PROVIDER.license_number must be unique, each PATIENT maps to one USER, and each PROVIDER maps to one USER.

CHECK constraints enforce valid values and logical time ranges. USER.role must be patient, provider, or admin. PATIENT.gender must be male, female, or other. PROVIDER_AVAILABILITY.day_of_week must be a valid day name. APPOINTMENT.end_time must be after start_time.

Foreign keys make sure appointments cannot point to missing patients, providers, departments, or statuses.

Delete behavior is also part of the business rules. Some dependent records cascade, such as a patient profile when the user is deleted. Other deletes are restricted. For example, a department cannot be deleted while providers or appointments still reference it.

## Slide 6: Normalization Validation
This slide shows the normalization and functional dependency view from the UI.

The functional dependency diagrams show that each table has a primary key that determines the non-key attributes in that table. For example, user_id determines user account fields, department_id determines department fields, and appointment_id determines appointment fields.

The schema satisfies 1NF because attributes are atomic and repeating groups were separated into their own tables.

It satisfies 2NF because the final tables use single-attribute primary keys, so there are no partial dependencies on part of a composite key.

It satisfies 3NF and BCNF because transitive dependencies were removed. Department facts, status labels, and user account data are stored in their own relations instead of being repeated inside appointments.

For 4NF and 5NF, provider availability and audit history were separated from appointments because they are independent multi-valued facts. This keeps the design lossless, non-redundant, and easier to maintain.

## Slide 7: Live Admin Dashboard
This slide shows the live Admin View dashboard.

The top metrics show the current record counts for users, patients, providers, and appointments. These values come from PostgreSQL, not from static mock data.

The appointment schedule table shows real appointment rows with readable patient and provider names. That requires joining APPOINTMENT to PATIENT, PROVIDER, USER, DEPARTMENT, and APPOINTMENT_STATUS.

The integrity monitor shows status counts and whether overlapping appointments were detected. In the seeded data, there are zero overlapping provider bookings.

The recent audit trail shows status-change history from APPOINTMENT_AUDIT_LOG. This supports accountability because the system records who changed an appointment and why.

## Slide 8: CRUD Demonstration
This slide shows the CRUD workbench.

The CRUD tab lets us create, retrieve, update, and delete records for users, patients, providers, departments, appointments, provider availability, and audit logs.

For appointment creation and updates, the UI collects patient, provider, department, status, date, start time, end time, reason, notes, and changed-by user. Required fields are validated before submission.

On the backend, appointment operations run through application logic connected to PostgreSQL. The database enforces constraints like foreign keys and CHECK constraints, while the application adds transaction-based checks for provider availability and overlapping bookings.

This screen is useful in the demo because it shows that the UI is not just displaying data. It is directly connected to the database and can perform real system operations.

## Slide 9: Advanced Retrieval Queries
This slide shows the Query Explorer.

The Query Explorer includes the required CRUD SQL scenarios and the advanced retrieval queries. Each query includes a scenario, the SQL statement, why JOIN is required, whether GROUP BY is used, and the expected behavior.

The screenshot shows the appointments-per-department query. This query joins DEPARTMENT with APPOINTMENT, groups by department name, and counts appointments per department.

This demonstrates two major assignment requirements: advanced retrieval using multiple tables and GROUP BY where applicable.

Other advanced queries include upcoming appointments with patient and provider names, provider availability by department, appointment history with status names, cancelled appointment audit details, double-booking detection, providers with zero appointments, and today’s full schedule.

## Slide 10: Edge-Case Handling
This slide shows the Edge Case Lab.

The Edge Case Lab is designed to demonstrate invalid or risky operations in a controlled way. It shows the user action, the expected handling, and the actual system response.

The screenshot shows an attempted delete of a dependent department. Cardiology still has providers and appointments referencing it, so PostgreSQL rejects the operation because of ON DELETE RESTRICT.

Other edge cases in the UI include duplicate email, invalid appointment time, invalid foreign key references, and conflicting provider bookings.

This is important because it proves the system does not just work for happy-path CRUD. It also prevents invalid and inconsistent data.

## Slide 11: Sprint Review & Retrospective
This slide summarizes the sprint review.

The main outcome is that we now have a working PostgreSQL database and a live UI that demonstrates report-exact schema behavior.

What worked well was separating the project into clear parts: SQL schema, seed data, API routes, UI sections, query explorer, edge-case lab, screenshots, and presentation materials. That made it easier to map the implementation back to the assignment rubric.

One improvement for Sprint 3 would be expanding beyond the admin demo into role-specific workflows. For example, patients could have a portal for booking and viewing appointments, and providers could have a schedule-focused view.

Another improvement would be more robust concurrency testing for simultaneous booking attempts.

## Slide 12: Conclusion and Sprint 3 Plan
To conclude, Sprint 2 validates the key database and UI requirements for the Healthcare Appointment Scheduling System.

The database is normalized, uses primary and foreign keys correctly, enforces important constraints, and includes meaningful sample data.

The UI demonstrates CRUD operations, advanced JOIN-based reporting, normalization evidence, and edge-case handling. It is ready to use as the guide for the demo video.

For Sprint 3, the next step is to refine the user experience, add role-based workflows, improve scheduling usability, and harden the system for more realistic healthcare operations.

Thank you for watching our Sprint 2 demo.
