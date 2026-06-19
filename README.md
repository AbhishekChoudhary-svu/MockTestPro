# MockTestPro - Full Stack Mock Test Platform

MockTestPro is a feature-rich, premium web application built using Next.js, tailwindcss, and MongoDB to simulate real-world online competitive exams (like SSC, Banking, Railways, and PSC). It features separate student and admin flows, an interactive exam dashboard, performance analysis with rich charts, and AI-powered question uploads.

---

## Key Features

### 👨‍🎓 Student Dashboard & Exam Workspace
- **Dynamic Catalog**: Browse exam catalogs sorted by categories (SSC, Banking, Railways, State PSC) and search by keywords.
- **Live Exam Simulator**: 
  - Section-locked structure with independent timers running in parallel with the overall exam timer.
  - Interactive navigation sidebar showing status of questions (Answered, Unanswered, Marked for Review).
  - Tab-switching detection to prevent cheating.
  - Zero-lag state synchronization to auto-align database updates with in-progress sessions.
- **Comprehensive Results & Analytics**:
  - Auto-calculates scores (with negative marking schemes), percentiles, and ranks.
  - Interactive visual analysis (Donut & Bar charts) powered by **Recharts**.
  - Inline solution explanations filterable by correct, wrong, or skipped questions.
- **My Attempts Dashboard**: Track history of mock tests showing progress bars for in-progress tests and performance summaries for completed ones.

### 🛡️ Admin Portal & Management Tools
- **Dynamic Category & Subject Manager**: Manage exam domains and subject tags directly from the admin dashboard with built-in auto-seeding fallbacks.
- **Manual Question Builder**: Form-based question generator with a **Live Student-View Preview Card** rendering difficulty, formatting, and options in real-time.
- **AI-Powered Bulk Import**: Paste raw question transcripts to automatically parse them into structured database entities using AI.
- **Flexible Exam Wizard (Stepper)**:
  - Step 1: Set details, durations, and dynamic category bindings.
  - Step 2: Configure sections, marking rules, and subject tagging.
  - Step 3: Search and select questions manually, or use **Auto-Randomization** filtered by subject tags.
  - Draft support: Save drafts at any stage without validating incomplete questions until publishing.

### 🔒 Security & Session Management
- **Role-Based Routing**: NextAuth configurations default new logins to `student` while protecting administrative APIs and panels under `admin` rules.
- **DB-Sync Session Invalidation**: Integrates a client-side `SessionWatcher` that periodically validates active sessions against the MongoDB backend. If an active user is deleted or banned, it auto-terminates the cookie session and redirects them to the login screen immediately.

---

## Technology Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google Provider & Credentials Bypass)
- **Styling**: Tailwind CSS & Vanilla CSS custom variables
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linter & Compiler**: ESLint & TypeScript

---

## Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and MongoDB installed.

### Environment Setup

Create a `.env` file in the root directory and configure the following:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_jwt_secret
NEXTAUTH_URL=http://localhost:3000

# NextAuth Google Provider details
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI bulk import details (Gemini or OpenAI API key)
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Clone and open the project directory:
   ```bash
   cd Mock-Test-App
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Seed default admin credentials and category templates (optional):
   ```bash
   npm run seed
   ```

4. Run the local development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build & Linting

Verify types, lint rules, and optimize bundles for production:

```bash
npm run build
```
