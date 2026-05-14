# Learning Management System - Comprehensive Tech Stack

This document outlines the complete technology stack used across the entire Learning Management System repository. It is broken down into architectural layers to explain *what* is used and *why*.

## 1. Core Framework & Frontend
*   **Next.js (v14.2.11):** The foundational React framework. Used for both the Frontend UI and Backend API (Route Handlers). It provides App Router for nested layouts, Server Components for performance, and seamless deployment.
*   **React (v18):** The core UI library for building component-based, interactive interfaces.
*   **TypeScript (v5):** Strongly typed JavaScript. Ensures massive codebase maintainability, intelligent IDE auto-completion, and catches runtime errors during compile time.
*   **Tailwind CSS (v3.4.1):** Utility-first CSS framework. Used to build the custom "Glassmorphic" premium aesthetic without writing massive custom CSS files.
*   **Framer Motion (v11.5.4):** Industry-leading animation library for React. Powers all the smooth page transitions, hover glows, dynamic progress bars, and modal pop-ins (`AnimatedButton`, `AnimatedInput`, page entries).
*   **Lucide React:** The SVG icon library used universally across the UI for crisp, customizable iconography.
*   **Recharts:** A composable charting library used for rendering analytics, such as student grades and course distributions.
*   **React Markdown:** Used to safely render markdown content, specifically for rendering the rich-text responses coming from the AI Microservice.

## 2. Backend & API Layer (Next.js Route Handlers)
*   **Next.js App Router API:** Located in `src/app/api/`, handling server-side logic, database interactions, and business logic (e.g., `/api/auth`, `/api/student`, `/api/teacher`).
*   **Zod:** Used for robust schema validation. Before data hits the database, Zod ensures the incoming JSON payloads are structurally perfect.
*   **React Hook Form:** Integrated with Zod to handle complex client-side forms (like syllabus creation or user registration) with built-in error handling.

## 3. Database & ORM
*   **PostgreSQL (pg driver):** The core relational database storing Users, Courses, Attendances, Payments, and Results.
*   **Drizzle ORM:** A lightweight, type-safe Object Relational Mapper. It directly translates our TypeScript schemas (`src/db/schema.ts`) into SQL queries. Chosen over Prisma for its raw SQL performance and edge compatibility.
*   **Drizzle Kit:** Used for database migrations (`npx drizzle-kit push:pg`), keeping the remote database in sync with local TypeScript schema changes.

## 4. Authentication & Security
*   **Bcryptjs:** Used in the auth layer to securely hash and salt user passwords before storing them in the PostgreSQL database.
*   **Jose:** A robust library used to generate and verify custom JSON Web Tokens (JWT).
*   **Custom HTTP-Only Cookies:** The generated JWTs are attached to secure, HTTP-only cookies to manage session state without exposing tokens to local storage (preventing XSS attacks).

## 5. Storage & Cloud
*   **Supabase Storage (`@supabase/supabase-js`):** Used strictly for direct client-to-cloud file uploads. Powers the `UploadModal` to host course materials (PDFs, Videos) and provides instant public URLs for streaming.

## 6. Client Data Management & State
*   **TanStack React Query (v5):** Used heavily for client-side data fetching, caching, and state synchronization. It powers the live-updating aspects of the dashboard (like polling for new community messages) and manages loading/error states effortlessly.

## 7. AI Microservice (Python)
*   **Python (v3):** The language powering the backend AI logic located in `ai-service/`.
*   **Flask:** A lightweight Python web framework used to expose the AI service via an API endpoint (`app.py`).
*   **Groq API:** The underlying AI provider. Used for blazing-fast inference to power the virtual LMS Assistant, allowing students and teachers to ask contextual questions about the university.

## 8. UI Utilities
*   **Tailwind Merge (`tailwind-merge`) & CLSX (`clsx`):** Utility libraries used to safely combine and overwrite Tailwind classes, specifically in reusable components like buttons and inputs.
*   **Class Variance Authority (`class-variance-authority`):** Used to construct design system variants (e.g., button sizes, destructive vs primary colors) in a type-safe way.
