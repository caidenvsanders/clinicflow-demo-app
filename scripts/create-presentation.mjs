import pptxgen from "pptxgenjs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Healthcare Database Team";
pptx.company = "Washington State University";
pptx.subject = "Sprint 2 Database Implementation and UI-Based System Validation";
pptx.title = "Healthcare Appointment Scheduling System";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US"
};
pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.333, height: 7.5 });

const navy = "15202B";
const blue = "2563EB";
const teal = "0F766E";
const slate = "475569";
const soft = "EFF6FF";
const white = "FFFFFF";
const screenshots = "artifacts/screenshots";

const slides = [
  {
    title: "Healthcare Appointment Scheduling System",
    subtitle: "Sprint 2: Database Implementation & UI-Based System Validation",
    body: ["Team: Caiden Sanders, Vsevolod Kovalev", "Goal: prove data integrity, CRUD behavior, edge-case handling, and advanced query support."]
  },
  {
    title: "Sprint 2 Objectives",
    bullets: [
      "Implement the healthcare scheduling database in SQL.",
      "Enforce primary keys, foreign keys, NOT NULL, UNIQUE, CHECK, and delete/update rules.",
      "Demonstrate CRUD workflows and advanced JOIN queries through a live UI.",
      "Show realistic failure handling for duplicate data, invalid references, unsafe deletes, and scheduling conflicts."
    ]
  },
  {
    title: "Kanban Board Walkthrough",
    image: `${screenshots}/06-kanban.png`,
    caption:
      "The Kanban board summarizes planned, in-progress, and completed Sprint 2 work for the video walkthrough."
  },
  {
    title: "Database Design",
    bullets: [
      "Core entities: USER, PATIENT, PROVIDER, DEPARTMENT, APPOINTMENT_STATUS, APPOINTMENT, PROVIDER_AVAILABILITY, APPOINTMENT_AUDIT_LOG.",
      "USER stores shared account data; PATIENT and PROVIDER store role-specific data.",
      "APPOINTMENT links patient, provider, department, and status through foreign keys.",
      "Audit history and provider availability are separated to prevent update anomalies."
    ]
  },
  {
    title: "Constraints and Business Rules",
    bullets: [
      "UNIQUE constraints protect natural identifiers like email and license number.",
      "CHECK constraints enforce valid roles, gender values, day names, and time ordering.",
      "ON DELETE CASCADE removes dependent patient records where appropriate.",
      "ON DELETE RESTRICT blocks unsafe provider or department deletion when appointments or providers depend on them."
    ]
  },
  {
    title: "Normalization Validation",
    image: `${screenshots}/05-normalization.png`,
    caption: "Functional dependencies and 1NF through 5NF analysis are presented directly in the UI."
  },
  {
    title: "Live Admin Dashboard",
    image: `${screenshots}/01-dashboard.png`,
    caption: "The dashboard reads from PostgreSQL and summarizes counts, schedule rows, integrity status, and audit activity."
  },
  {
    title: "CRUD Demonstration",
    image: `${screenshots}/02-crud-appointments.png`,
    caption: "The CRUD workbench supports create, update, delete, and retrieve operations against the report schema."
  },
  {
    title: "Advanced Retrieval Queries",
    image: `${screenshots}/03-query-explorer.png`,
    caption: "The Query Explorer documents each scenario, SQL statement, JOIN/GROUP BY reasoning, and live output."
  },
  {
    title: "Edge-Case Handling",
    image: `${screenshots}/04-edge-case.png`,
    caption: "The UI shows the user action, expected handling, and database response when a rule is violated."
  },
  {
    title: "Sprint Review & Retrospective",
    bullets: [
      "Outcome: the database and UI demonstrate report-exact schema behavior with live PostgreSQL.",
      "What worked: separating report SQL, API routes, and UI sections made the demo easy to navigate.",
      "Improvement: Sprint 3 can add authentication, calendar views, patient/provider portals, and more robust concurrency tests.",
      "Risk reduced: edge cases are now visible instead of only described in the report."
    ]
  },
  {
    title: "Conclusion and Sprint 3 Plan",
    bullets: [
      "Sprint 2 validates database integrity, normalization, CRUD operations, and advanced retrieval queries.",
      "The UI is ready for a structured demo video with live interactions.",
      "Sprint 3 should refine the user experience, add role-based workflows, and harden scheduling operations for production use.",
      "Final deliverables: Sprint Report, demo video, and GitHub repository link."
    ]
  }
];

for (const slideData of slides) {
  if (slideData.subtitle) {
    titleSlide(slideData);
  } else if (slideData.image) {
    imageSlide(slideData);
  } else {
    bulletSlide(slideData);
  }
}

await pptx.writeFile({ fileName: "artifacts/presentation/Healthcare_Appointment_Scheduling_Sprint2_Demo.pptx" });

function titleSlide({ title, subtitle, body }) {
  const slide = baseSlide();
  slide.addText("Admin View", {
    x: 0.65,
    y: 0.45,
    w: 2.1,
    h: 0.35,
    color: blue,
    bold: true,
    fontSize: 14,
    charSpace: 1.8
  });
  slide.addText(title, {
    x: 0.65,
    y: 1.3,
    w: 10.8,
    h: 0.85,
    color: navy,
    bold: true,
    fontSize: 36,
    fit: "shrink"
  });
  slide.addText(subtitle, {
    x: 0.68,
    y: 2.2,
    w: 10.5,
    h: 0.45,
    color: slate,
    fontSize: 18
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.68,
    y: 3.15,
    w: 5.7,
    h: 1.5,
    rectRadius: 0.08,
    fill: { color: soft },
    line: { color: "DBEAFE" }
  });
  slide.addText(body.join("\n"), {
    x: 0.95,
    y: 3.42,
    w: 5.15,
    h: 0.95,
    color: navy,
    fontSize: 15,
    breakLine: false,
    fit: "shrink"
  });
  slide.addShape(pptx.ShapeType.arc, {
    x: 8.6,
    y: 1.1,
    w: 3.8,
    h: 3.8,
    line: { color: teal, width: 6 },
    adjustPoint: 0.2
  });
  footer(slide);
}

function bulletSlide({ title, bullets }) {
  const slide = baseSlide();
  heading(slide, title);
  slide.addText(
    bullets.map((text) => ({ text, options: { bullet: { indent: 18 }, hanging: 4 } })),
    {
      x: 0.9,
      y: 1.55,
      w: 11.5,
      h: 4.6,
      color: navy,
      fontSize: 20,
      breakLine: true,
      paraSpaceAfterPt: 11,
      fit: "shrink"
    }
  );
  footer(slide);
}

function imageSlide({ title, image, caption }) {
  const slide = baseSlide();
  heading(slide, title);
  slide.addImage({
    path: image,
    x: 0.75,
    y: 1.25,
    w: 11.85,
    h: 5.25,
    sizing: { type: "contain", x: 0.75, y: 1.25, w: 11.85, h: 5.25 }
  });
  slide.addText(caption, {
    x: 0.85,
    y: 6.62,
    w: 11.4,
    h: 0.32,
    color: slate,
    fontSize: 12,
    fit: "shrink"
  });
  footer(slide);
}

function baseSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: "F8FAFC" };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.18,
    fill: { color: blue },
    line: { color: blue }
  });
  return slide;
}

function heading(slide, text) {
  slide.addText(text, {
    x: 0.65,
    y: 0.45,
    w: 11.5,
    h: 0.55,
    color: navy,
    bold: true,
    fontSize: 27,
    fit: "shrink"
  });
}

function footer(slide) {
  slide.addText("Healthcare Appointment Scheduling System | Sprint 2 Demo", {
    x: 0.65,
    y: 7.04,
    w: 7.5,
    h: 0.22,
    color: "64748B",
    fontSize: 9
  });
}
