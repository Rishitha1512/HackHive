# 🐝 HackHive

**Find your hive. Build together. Hack together.**

HackHive is a university hackathon platform that helps students discover hackathons, find teammates, build teams, and collaborate with other students.

## ✨ Features

- **Authentication:** Sign up and log in using Supabase Auth and Google OAuth.
- **Student Profiles:** Create profiles with university details, skills, and profile pictures.
- **Hackathon Discovery:** Browse hackathons and explore their details.
- **Team Creation:** Create teams with descriptions, required skills, team size, and recruitment deadlines.
- **Team Applications:** Apply to join teams and track application statuses.
- **Application Management:** Team creators can review, accept, or reject applications.
- **Team Workspace:** View team members and collaborate through team chat.
- **Single Active Team:** Students can belong to only one active team at a time. They can join or create another team after their current hackathon ends.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth, Google OAuth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd hackhive
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and add your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Configure Google OAuth in your Supabase project if you want to use Google sign-in.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```text
hackhive/
├── public/                 # Static assets and images
├── src/
│   ├── app/                # Next.js pages and routes
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Supabase clients and utilities
│   └── types/              # TypeScript type definitions
├── .env.local              # Environment variables
├── package.json
└── README.md
```

## 📋 Application Rules

- Students can submit up to 5 active team applications.
- Submitting applications to multiple teams is allowed.
- A student can belong to only one active team at a time.
- An active team is associated with a hackathon whose end date has not passed.
- Once the hackathon ends, the student can join or create another team.
- Team membership and application restrictions are enforced through database validation.

## 🏗️ Production Build

To create a production build:

```bash
npm run build
```

To run the production build locally:

```bash
npm start
```

## 🔐 Security

- Supabase handles authentication.
- PostgreSQL Row Level Security (RLS) protects database access.
- Database functions and triggers enforce important application rules.
- Environment variables are used to configure Supabase credentials.

## 🎯 Goal

HackHive aims to make hackathon participation easier by connecting students with opportunities and teammates, all in one platform.