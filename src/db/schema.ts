import { pgTable, text, timestamp, pgEnum, boolean, integer } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const roleEnum = pgEnum("Role", ["ADMIN", "TEACHER", "STUDENT"]);
export const residentStatusEnum = pgEnum("ResidentStatus", ["HOSTELER", "DAYSCHOLAR_BUS", "DAYSCHOLAR_NORMAL"]);
export const feeTypeEnum = pgEnum("FeeType", ["TUITION", "HOSTEL", "BUS", "OTHER"]);

export const users = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("STUDENT").notNull(),
  departmentId: text("departmentId"),
  semester: integer("semester"), // 1-8
  rollNumber: text("rollNumber"), // e.g. CSE001
  residentStatus: residentStatusEnum("residentStatus").default("DAYSCHOLAR_NORMAL").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const departments = pgTable("Department", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const courses = pgTable("Course", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  level: text("level").notNull(), // Beginner, Intermediate, Advanced
  semester: integer("semester").notNull().default(1), // 1-8
  categoryId: text("categoryId").references(() => departments.id, { onDelete: "set null" }),
  teacherId: text("teacherId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const enrollmentStatusEnum = pgEnum("EnrollmentStatus", ["ACTIVE", "COMPLETED", "DROPPED"]);

export const enrollments = pgTable("Enrollment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text("studentId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: text("courseId")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  status: enrollmentStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const materials = pgTable("Material", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  courseId: text("courseId")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: text("fileType").notNull(), // e.g. "PDF", "Video"
  size: text("size").notNull(), // e.g. "2.4 MB"
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const materialProgress = pgTable("MaterialProgress", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text("studentId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  materialId: text("materialId")
    .notNull()
    .references(() => materials.id, { onDelete: "cascade" }),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const notifications = pgTable("Notification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const payments = pgTable("Payment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("PENDING"),
  feeType: feeTypeEnum("feeType").default("TUITION").notNull(),
  receiptUrl: text("receiptUrl"),
  date: timestamp("date", { precision: 3, mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const attendance = pgTable("Attendance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  date: timestamp("date", { precision: 3, mode: "date" }).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const results = pgTable("Result", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  marks: integer("marks").notNull(),
  grade: text("grade").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const assignments = pgTable("Assignment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate", { precision: 3, mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const submissions = pgTable("Submission", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assignmentId: text("assignmentId").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  fileUrl: text("fileUrl"),
  status: text("status").notNull().default("SUBMITTED"),
  marks: integer("marks"),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const schedule = pgTable("Schedule", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  teacherId: text("teacherId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date", { precision: 3, mode: "date" }).notNull(),
  time: text("time").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const messages = pgTable("Message", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text("senderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: text("receiverId").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const downloads = pgTable("Download", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  materialId: text("materialId").notNull().references(() => materials.id, { onDelete: "cascade" }),
  downloadedAt: timestamp("downloadedAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const syllabus = pgTable("Syllabus", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const certificates = pgTable("Certificate", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("studentId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  issuedDate: timestamp("issuedDate", { precision: 3, mode: "date" }).defaultNow().notNull(),
  certificateUrl: text("certificateUrl"),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  courses: many(courses),
  enrollments: many(enrollments),
  materialProgress: many(materialProgress),
  notifications: many(notifications),
  payments: many(payments),
  attendance: many(attendance),
  results: many(results),
  submissions: many(submissions),
  schedules: many(schedule),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  downloads: many(downloads),
  certificates: many(certificates),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
  }),
  materials: many(materials),
  enrollments: many(enrollments),
  attendance: many(attendance),
  results: many(results),
  assignments: many(assignments),
  schedules: many(schedule),
  syllabus: many(syllabus),
  certificates: many(certificates),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  course: one(courses, {
    fields: [materials.courseId],
    references: [courses.id],
  }),
  progress: many(materialProgress),
  downloads: many(downloads),
}));

export const materialProgressRelations = relations(materialProgress, ({ one }) => ({
  student: one(users, {
    fields: [materialProgress.studentId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [materialProgress.materialId],
    references: [materials.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, { fields: [attendance.userId], references: [users.id] }),
  course: one(courses, { fields: [attendance.courseId], references: [courses.id] }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  user: one(users, { fields: [results.userId], references: [users.id] }),
  course: one(courses, { fields: [results.courseId], references: [courses.id] }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, { fields: [assignments.courseId], references: [courses.id] }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, { fields: [submissions.assignmentId], references: [assignments.id] }),
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  courses: many(courses),
}));

export const scheduleRelations = relations(schedule, ({ one }) => ({
  course: one(courses, { fields: [schedule.courseId], references: [courses.id] }),
  teacher: one(users, { fields: [schedule.teacherId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "sentMessages" }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: "receivedMessages" }),
}));

export const downloadsRelations = relations(downloads, ({ one }) => ({
  user: one(users, { fields: [downloads.userId], references: [users.id] }),
  material: one(materials, { fields: [downloads.materialId], references: [materials.id] }),
}));

export const syllabusRelations = relations(syllabus, ({ one }) => ({
  course: one(courses, { fields: [syllabus.courseId], references: [courses.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  student: one(users, { fields: [certificates.studentId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
}));
