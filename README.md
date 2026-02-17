# FoneRoster — Formula One Telecom Logistics

A production-grade roster management system for Formula One Telecom Logistics built with React, Vite, Firebase, and a Neo-Brutalist design system.

## Features

- **Real-time Dashboard**: Live clock, hotline operator display, shift-based team views (Day/Night)
- **Field Team Management**: Dynamic team creation, assignment of drivers/supervisors/helpers, field supervisor tracking
- **Hotline Configuration**: Flexible shift modes (3×8hr Standard or 2×12hr Leave)
- **Employee Directory**: Full CRUD with search, pagination, form validation (react-hook-form + zod)
- **Authentication**: Firebase Auth integration with protected routes
- **Data Persistence**: Firestore integration with graceful local-state fallback
- **Neo-Brutalist Design**: Bold borders, hard shadows, striking typography

## Prerequisites

- Node.js 18+ and npm
- Firebase project (optional for local development — app works with in-memory state)

## Setup

1. **Clone and install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure Firebase (optional):**
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password provider)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config values
   - Create a \`.env\` file based on \`.env.example\` and paste your values

   > **Note:** The app works without Firebase — all data will be stored in-memory and reset on refresh.

3. **Run development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Build for production:**
   \`\`\`bash
   npm run build
   \`\`\`

## Project Structure

\`\`\`
src/
├── components/
│   ├── ui/              # Reusable UI components (Button, Card, Input, etc.)
│   ├── layout/          # Header, ProtectedRoute
│   └── feedback/        # ErrorBoundary, LoadingSpinner
├── config/              # Firebase configuration
├── context/             # AuthContext, RosterContext
├── features/
│   ├── dashboard/       # LiveClock, HotlinePanel, NeoTeamCard
│   ├── roster/          # RosterManager, FieldTeamConfig, HotlineConfig
│   ├── directory/       # EmployeeForm, EmployeeTable
│   └── auth/            # LoginForm
├── hooks/               # useAuth, useClock, useShiftLogic
├── lib/                 # Utils, constants, validators
└── pages/               # Page components with lazy loading
\`\`\`

## Default Credentials

When Firebase Auth is configured, you'll need to create users manually in the Firebase Console. The app does not ship with default credentials.

For local testing without Firebase, you can modify \`AuthContext.jsx\` to bypass authentication.

## Technologies

- **React 18** + **Vite** — Fast development with HMR
- **React Router DOM** — Client-side routing with lazy loading
- **Firebase** — Authentication, Firestore, Storage
- **React Hook Form** + **Zod** — Type-safe form validation
- **Tailwind CSS** — Utility-first styling with custom Neo-Brutalist theme
- **Sonner** — Beautiful toast notifications
- **Lucide React** — Icon library

## License

Proprietary — Formula One Telecom Logistics
