# Adarsh Stationery

Adarsh Stationery is a full-stack, cinematic e-commerce stationery platform built with Next.js 15. The application includes a premium presentational customer interface and a secure, responsive administrative panel that manages inventory catalog indexes, brand manufacturer profiles, category hierarchies, and team member permissions.

---

## Tech Stack

The technologies utilized in this project are based on the actual dependencies:

- **Frontend & UI Framework**:
  - **Next.js 15 (App Router)** — React framework for server-rendered page loading, routing, and dynamic layouts.
  - **React 19** — Next-generation library for building user interfaces.
  - **Tailwind CSS v4** — High-performance utility-first styling for premium dark modes, gradients, and custom components.
  - **Lucide React** — Rich, modern iconography package.
  - **Base UI & Radix UI Primitives** — Fully accessible, unstyled UI components integrated with Shadcn.
- **Backend & Database**:
  - **Next.js Serverless Route Handlers** — Lightweight backend API endpoints.
  - **Mongoose / MongoDB** — Object Data Modeling (ODM) for MongoDB data mapping, schema enforcement, and aggregation queries.
- **State & Form Management**:
  - **TanStack Query (React Query v5)** — Server-state management, query caching, real-time cache mutations, and automatic dashboard syncs.
  - **React Hook Form & Zod** — Uncontrolled form validation, error handling, and runtime payload sanity checks.
- **Security & Hashing**:
  - **NextAuth.js v4** — Safe administrative OAuth integration (Google Provider).
  - **Bcrypt.js** — Secure password encryption hashing.
  - **JSONWebToken (JWT)** — Session token validation and payload signatures.
- **Integrations**:
  - **Google Gemini API (`@google/genai`)** — AI product description generation and semantic content helpers.
  - **Pollinations.ai / Iconify** — Generative AI categories illustration and fallback SVG icon picker indexing.
  - **Cloudinary CDN** — Media storage URL resolution and client-side AI image transformations.
  - **Razorpay SDK** — Payment gateway client module (ready for checkout integrations).
  - **EmailJS / Resend** — Email delivery systems for sending secure team-member invites.

---

## Features

### Admin Side

- **Secure Login & Session Middleware**: Administrative access is gated using NextAuth Google OAuth. Only authorized emails listed in the database or matching the designated Super Admin configuration can access the backend dashboard.
- **Team Access Control**:
  - Superadmins can send secure team invitations (24-hour expiration tokens) generated via crypto API.
  - Invite delivery is processed via API calls to EmailJS.
  - Controls to block/unblock or delete team members (with safety block on deleting superadmin accounts).
- **Category Hierarchy Management**:
  - Create, edit, toggle status, and delete category items.
  - AI-assisted Category Icon Generation using Pollinations.ai with automated prompt enhancement.
  - Manual file upload and searchable fallback icon picker.
  - **Safety Guard**: Prevents deletion of a category if active products in the inventory are associated with it.
- **Product Inventory Management**:
  - Add, modify, or delete items in the stock inventory.
  - Form validation via Zod covering name, category mapping, brand, pricing, cost, stock units, description, and images.
  - Multi-image file uploader supporting up to 3 slots.
- **Brand & Manufacturer Registry**:
  - Manage brand profiles with name, website URL, description, logo, and categories.
  - **Safety Guard**: Prevents deletion of brand profiles if active products in the inventory are linked to them.

### Customer Side

- **Cinematic Landing Page**: Premium presentational interface featuring glassmorphic cards, gradients, and typography designed with Tailwind CSS v4 variables.
- **Mock Statistics Overview**: Display of sales pulses (mock metrics for Revenue, Orders, and Growth) to give users an immediate feel of store statistics.

---

## Project Structure

A concise view of the `src` folder structure:

```text
src/
├── app/                  # Next.js 15 App Router directory
│   ├── (admin)/          # Admin-specific route group
│   │   └── admin/        # Admin panel pages (dashboard, brands, products, categories, team-members, sign-in)
│   ├── api/              # Full-stack API endpoints (Next.js serverless functions)
│   │   ├── admin/        # Admin CRUD operations, invite endpoint, and AI generator endpoint
│   │   └── auth/         # NextAuth OAuth and logout configuration
│   ├── globals.css       # Core stylesheet (Tailwind CSS v4 variables and custom styles)
│   ├── layout.js         # Root client HTML layout
│   └── page.js           # Client-side presentational landing page
├── components/           # Reusable React components
│   ├── admin/            # Admin-specific views (e.g. IconLibraryPicker)
│   └── ui/               # Shared UI elements (Dialog, Table, Sidebar, Navbar, Button, Input)
├── context/              # React Context Providers (TanStack Query, NextAuth session)
├── email_template/       # Email HTML components (invite templates)
├── lib/                  # Library setups (Mongoose dbConnect, Axios client, NextAuth configuration)
├── models/               # MongoDB models (Mongoose schemas for Admin, Invite, Product, Category, Brand)
├── schemas/              # Client/server Zod schemas for form validation
├── utils/                # Helper utilities (sendInviteEmail, ApiError, ApiResponse, asyncHandler)
└── middleware.js         # Next.js middleware enforcing session protection on admin routes
```

---

## Environment Variables

These environment variables are referenced in the codebase. Create a `.env.local` file at the root of the project to define them:

### Database Config
- `MONGODB_URI` — The MongoDB connection string.

### Authentication Config
- `NEXTAUTH_SECRET` — Symmetric key used by NextAuth to sign JWT tokens.
- `NEXTAUTH_URL` — Canonical site URL, defaults to `http://localhost:3000` in local development.
- `GOOGLE_CLIENT_ID` — Google OAuth Client ID for administrative logins.
- `GOOGLE_CLIENT_SECRET` — Google OAuth Client Secret for administrative logins.
- `SUPER_ADMIN_EMAIL` — Email address automatically granted the `superadmin` role upon first login.

### Email Integration Config
- `EMAILJS_SERVICE_ID` — EmailJS service ID used to send team member invites.
- `EMAILJS_TEMPLATE_ID` — EmailJS template ID for invitation emails.
- `EMAILJS_PUBLIC_KEY` — EmailJS public/user key.
- `EMAILJS_PRIVATE_KEY` — EmailJS private access token.
- `ADMIN_RESEND_API_KEY` — Resend API key (defined but commented out).

### AI Integration Config
- `GEMINI_API_KEY` — Google Gemini model access API key (used in server-side content generation).

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd adarsh-stationery
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file at the root and fill in the parameters listed in the **Environment Variables** section.

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Roadmap / Work in Progress

These administrative systems and customer modules are currently planned or in development:

- **Order & Invoice Management**: Systems to track order statuses, shipment workflows, and generate dynamic invoice receipts.
- **Interactive Dashboard Analytics**: Interactive sales metrics, historical order charts, and automated low-stock warnings.
- **Customer Management Panel**: Administrative search, customer transaction history, and access control.
- **System Settings & Configuration**: Controls to customize store thresholds, VAT rates, and delivery rates.
- **Admin Profile Customization**: Individual settings for admin details and profile updates.

---

## Tech Highlights

- **Dynamic Aggregation Pipeline**: The category controller utilizes MongoDB lookup aggregations to dynamically count active linked products in the categories list, avoiding duplicate queries.
- **Cloudinary AI Image Transforms**: The Brand logo enhancer parses image URLs hosted on Cloudinary, injects background removal parameters (`e_bgremoval`), enhances visual contrast (`e_enhance`), and attaches a 3D drop shadow (`e_shadow:40`) instantly on the fly.
- **Relational Integrity Guardrails**: Backend controllers inspect references prior to delete executions, preventing the removal of brands or categories that contain active products to maintain system integrity.
- **Dual-Layer Shared Form Validation**: The codebase shares Zod validation schemas between client-side react-hook-form inputs and backend API route request bodies, guaranteeing unified data sanitization.
