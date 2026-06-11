import { pgTable, text, timestamp, pgEnum, boolean, integer } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const roleEnum = pgEnum("Role", ["ADMIN", "TEACHER", "STUDENT", "ALUMNI"]);
export const residentStatusEnum = pgEnum("ResidentStatus", ["HOSTELER", "DAYSCHOLAR_BUS", "DAYSCHOLAR_NORMAL"]);
export const feeTypeEnum = pgEnum("FeeType", ["TUITION", "HOSTEL", "BUS", "SUPPLEMENTARY", "CONDONATION", "OTHER"]);
export const studentActivityTypeEnum = pgEnum("StudentActivityType", ["CERTIFICATION", "HACKATHON", "CONTEST", "WORKSHOP", "OTHER"]);
export const admissionQuotaEnum = pgEnum("AdmissionQuota", ["CONVENER", "MANAGEMENT", "NRI", "SPOT"]);
export const activityStatusEnum = pgEnum("ActivityStatus", ["PENDING", "APPROVED", "REJECTED"]);

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
  admissionQuota: admissionQuotaEnum("admissionQuota").default("CONVENER").notNull(),
  isFeeReimbursed: boolean("isFeeReimbursed").default(false).notNull(),
  libraryCleared: boolean("libraryCleared").default(false).notNull(),
  hostelCleared: boolean("hostelCleared").default(false).notNull(),
  accountsCleared: boolean("accountsCleared").default(false).notNull(),
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
  typeOfEducation: text("typeOfEducation").default("B.Tech").notNull(),
  totalSemesters: integer("totalSemesters").default(8).notNull(),
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
  credits: integer("credits").notNull().default(3),
  isOpenElective: boolean("isOpenElective").default(false).notNull(),
  categoryId: text("categoryId").references(() => departments.id, { onDelete: "set null" }),
  teacherId: text("teacherId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  prerequisiteCourseId: text("prerequisiteCourseId"),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const enrollmentStatusEnum = pgEnum("EnrollmentStatus", ["ACTIVE", "COMPLETED", "DROPPED"]);
export const waitlistStatusEnum = pgEnum("WaitlistStatus", ["WAITING", "PROMOTED"]);

export const courseFaculty = pgTable("CourseFaculty", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
  teacherId: text("teacherId").notNull().references(() => users.id, { onDelete: "cascade" }),
  capacity: integer("capacity").notNull().default(60),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

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
  courseFacultyId: text("courseFacultyId").references(() => courseFaculty.id, { onDelete: "set null" }),
  status: enrollmentStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const waitlists = pgTable("Waitlist", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("studentId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseFacultyId: text("courseFacultyId").notNull().references(() => courseFaculty.id, { onDelete: "cascade" }),
  status: waitlistStatusEnum("status").default("WAITING").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
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

export const feeStructure = pgTable("FeeStructure", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  feeType: text("feeType").notNull(), // TUITION, BUS, HOSTEL, EXAM, LAB, LIBRARY, PLACEMENT, MATERIAL, CERTIFICATION, MISC
  amount: integer("amount").notNull(),
  discountAmount: integer("discountAmount").default(0).notNull(),
  paidAmount: integer("paidAmount").default(0).notNull(),
  dueDate: timestamp("dueDate", { precision: 3, mode: "date" }).notNull(),
  lateFee: integer("lateFee").default(0).notNull(),
  isLateFeeExempt: boolean("isLateFeeExempt").default(false).notNull(),
  semester: integer("semester").default(1).notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING, PAID, OVERDUE
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const payments = pgTable("Payment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("PENDING"),
  feeType: feeTypeEnum("feeType").default("TUITION").notNull(),
  feeStructureId: text("feeStructureId").references(() => feeStructure.id, { onDelete: "set null" }),
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
  updatedBy: text("updatedBy").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const results = pgTable("Result", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }),
  studentName: text("studentName"),
  studentRollNumber: text("studentRollNumber"),
  semester: integer("semester").default(1).notNull(),
  subjectCode: text("subjectCode"),
  subjectName: text("subjectName"),
  internalMarks: integer("internalMarks").default(0).notNull(),
  externalMarks: integer("externalMarks").default(0).notNull(),
  marks: integer("marks").notNull(), // total marks
  credits: integer("credits").default(0).notNull(),
  grade: text("grade").notNull(),
  status: text("status").default("PASS").notNull(),
  published: boolean("published").default(false).notNull(),
  isReevaluationApplied: boolean("isReevaluationApplied").default(false).notNull(),
  graceMarksAdded: integer("graceMarksAdded").default(0).notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const studentSemesterSummary = pgTable("StudentSemesterSummary", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  semester: integer("semester").notNull(),
  sgpa: text("sgpa"),
  cgpa: text("cgpa"),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
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

export const posts = pgTable("Post", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  authorId: text("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  category: text("category").notNull(), // ANNOUNCEMENTS, ACADEMICS, PLACEMENTS, EVENTS, ACHIEVEMENTS, GENERAL
  attachments: text("attachments"), // stringified JSON array of { name: string, url: string, type: string }
  linkShare: text("linkShare"),
  isPinned: boolean("isPinned").default(false).notNull(),
  isAnnouncement: boolean("isAnnouncement").default(false).notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const postLikes = pgTable("PostLike", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const comments = pgTable("Comment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentId: text("parentId").references((): any => (comments as any).id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
});

export const postSaves = pgTable("PostSave", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
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

export const studentActivities = pgTable("StudentActivity", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("studentId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: studentActivityTypeEnum("type").notNull(),
  description: text("description"),
  proofUrl: text("proofUrl"),
  date: timestamp("date", { precision: 3, mode: "date" }).defaultNow().notNull(),
  marks: integer("marks"),
  verificationStatus: activityStatusEnum("verificationStatus").default("PENDING").notNull(),
  evaluatedBy: text("evaluatedBy").references(() => users.id, { onDelete: "set null" }),
  evaluatedAt: timestamp("evaluatedAt", { precision: 3, mode: "date" }),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).defaultNow().notNull(),
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
  posts: many(posts),
  postLikes: many(postLikes),
  comments: many(comments),
  postSaves: many(postSaves),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  downloads: many(downloads),
  certificates: many(certificates),
  activities: many(studentActivities),
  courseFaculties: many(courseFaculty),
  waitlists: many(waitlists),
  semesterSummaries: many(studentSemesterSummary),
  feeStructures: many(feeStructure),
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

export const studentActivitiesRelations = relations(studentActivities, ({ one }) => ({
  student: one(users, {
    fields: [studentActivities.studentId],
    references: [users.id],
  }),
}));

export const courseFacultyRelations = relations(courseFaculty, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseFaculty.courseId],
    references: [courses.id],
  }),
  teacher: one(users, {
    fields: [courseFaculty.teacherId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  waitlists: many(waitlists),
}));

export const waitlistsRelations = relations(waitlists, ({ one }) => ({
  student: one(users, {
    fields: [waitlists.studentId],
    references: [users.id],
  }),
  courseFaculty: one(courseFaculty, {
    fields: [waitlists.courseFacultyId],
    references: [courseFaculty.id],
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
  courseFaculty: one(courseFaculty, {
    fields: [enrollments.courseFacultyId],
    references: [courseFaculty.id],
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
  feeStructure: one(feeStructure, { fields: [payments.feeStructureId], references: [feeStructure.id] }),
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

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  likes: many(postLikes),
  comments: many(comments),
  saves: many(postSaves),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "replies" }),
  replies: many(comments, { relationName: "replies" }),
}));

export const postSavesRelations = relations(postSaves, ({ one }) => ({
  post: one(posts, { fields: [postSaves.postId], references: [posts.id] }),
  user: one(users, { fields: [postSaves.userId], references: [users.id] }),
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

export const studentSemesterSummaryRelations = relations(studentSemesterSummary, ({ one }) => ({
  user: one(users, { fields: [studentSemesterSummary.userId], references: [users.id] }),
}));

export const feeStructureRelations = relations(feeStructure, ({ one, many }) => ({
  user: one(users, { fields: [feeStructure.userId], references: [users.id] }),
  payments: many(payments),
}));

