# Project Orion ✨

A modern on-call companion dashboard for managing teams, schedules, incidents, and shadow assignments with enterprise-grade features.

## Features

### � User & Team Management
- **User Authentication**: Secure login system with local authentication and OAuth support
- **Role-Based Access Control**: Three user roles (Admin, User, Viewer) with granular permissions
- **User Management**: Create and manage users with profiles, contact information, and custom avatars
- **Team Organization**: Create teams with custom colors, assign members, and manage team ownership
- **Member Profiles**: Comprehensive user profiles with avatars, roles, and contact details
- **Default Avatars**: Auto-generated colored avatars with initials when no photo provided

### 📅 Calendar & Scheduling
- **Visual Calendar**: Interactive weekly calendar view showing all on-call assignments
- **Assignment Scheduling**: Schedule team members with notes and support for multiple assignments per day
- **Team Switching**: Seamlessly switch between team assignments within the same modal
- **Duplicate Prevention**: Smart detection and prevention of conflicting assignments
- **Auto-Load Existing**: Automatically loads existing assignments when selecting duplicate team/date combinations

### 🎓 Shadowing System
- **Shadow Assignments**: Assign new members to shadow experienced team members for training
- **Multiple Shadows**: Support for multiple shadow members per primary member
- **Date Ranges**: Define shadow assignment periods with start and end dates
- **Duplicate Detection**: Visual warnings for existing shadow assignments with smart filtering
- **Search & Select**: Intuitive search interface for selecting primary and shadow members

### 🚨 Incident Management
- **Incident Tracking**: Create and manage incidents with severity levels (critical, high, medium, low)
- **Status Workflow**: Track incidents through states (new, in_progress, closed)
- **Auto-Assignment**: Automatic assignment to users when starting work on incidents
- **Team Assignment**: Assign incidents to specific teams with automatic routing
- **Notes & Timeline**: Add notes and view complete incident timeline with user attribution
- **Webhook Integration**: Receive alerts from monitoring tools (Prometheus, Grafana, Dynatrace, Custom)
- **Webhook Tester**: Built-in webhook testing tool (admin-only) with pre-configured templates

### 📊 Analytics & Reporting
- **Assignment Statistics**: View detailed assignment statistics with customizable date ranges
- **Workload Distribution**: Analyze assignment counts per member with visual progress bars
- **Team Analytics**: Filter statistics by teams and members
- **CSV Export**: Export analytics data for external reporting
- **Member Comparison**: Compare assignment distribution across team members

### 🔍 User Experience
- **Search Functionality**: Fast search across users, teams, incidents, and shadow assignments
- **Mobile Responsive**: Fully optimized for mobile, tablet, and desktop devices with responsive layouts
- **Dark Mode**: Built-in dark mode support with persistent theme preference
- **Real-time Updates**: Changes reflect immediately across all views
- **Smart Notifications**: Visual alerts for important actions and state changes

### 🔒 Security & Permissions
- **Session Management**: Secure session-based authentication with HTTP-only cookies
- **Permission System**: Granular permission checks for all CRUD operations
- **User Attribution**: All actions are attributed to the performing user in logs and timelines
- **Protected Routes**: Middleware-based route protection for authenticated areas
- **Role Enforcement**: Server-side role validation for sensitive operations

### 💾 Data & Performance
- **SQLite Database**: Production-ready SQLite database with WAL mode for better concurrency
- **Automatic Migration**: Database schema automatically migrates and drops deprecated tables
- **Persistent Storage**: All data persists across browser sessions with file-based storage
- **Indexed Queries**: Optimized database indexes for fast lookups
- **Transaction Support**: ACID-compliant transactions for data integrity

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TheRealVira/Project-Orion.git
cd Project-Orion
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

On first run, the application will:
1. Create the SQLite database at `data/orion.db`
2. Initialize the database schema
3. Seed sample data (users, teams, assignments)
4. Create a default admin user

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123` (change this immediately!)

### Quick Start Guide

1. **Login**: Use the default admin credentials or create a new account
2. **Create Users**: Navigate to the "Users" tab and add team members
3. **Create Teams**: Go to "Teams" tab and organize users into teams
4. **Schedule Assignments**: Use the "Calendar" tab to assign on-call duties
5. **Track Incidents**: Switch to "Incidents" tab to manage ongoing issues
6. **Setup Shadows**: Use "Shadows" tab to pair experienced members with new ones
7. **View Analytics**: Check "Analytics" tab for workload distribution insights

## Project Structure

```
Project-Orion/
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── incidents/            # Incident management API
│   │   │   ├── teams/                # Team CRUD operations
│   │   │   ├── users/                # User management API
│   │   │   └── webhooks/             # Webhook receivers
│   │   ├── login/                    # Login page
│   │   ├── layout.tsx                # Root layout with auth provider
│   │   ├── page.tsx                  # Main dashboard
│   │   └── globals.css               # Global styles with Tailwind
│   ├── components/                   # React components
│   │   ├── CalendarView.tsx          # Weekly calendar with assignments
│   │   ├── IncidentList.tsx          # Incident management UI
│   │   ├── IncidentDetail.tsx        # Incident detail modal with notes
│   │   ├── UserList.tsx              # User management (formerly MemberList)
│   │   ├── TeamList.tsx              # Team management with owners
│   │   ├── ShadowList.tsx            # Shadow assignment management
│   │   ├── AnalyticsView.tsx         # Statistics and reporting
│   │   ├── AssignmentFormModal.tsx   # Assignment creation/edit form
│   │   ├── ShadowFormModal.tsx       # Shadow assignment form
│   │   ├── WebhookTesterModal.tsx    # Webhook testing interface
│   │   ├── UserProfile.tsx           # User dropdown menu
│   │   ├── Avatar.tsx                # Avatar component with fallback
│   │   └── ...                       # Additional UI components
│   ├── contexts/                     # React contexts
│   │   └── AuthContext.tsx           # Authentication context provider
│   ├── lib/                          # Business logic & utilities
│   │   ├── auth.ts                   # Authentication functions
│   │   ├── database.ts               # SQLite database initialization
│   │   ├── services.ts               # Data service layer
│   │   ├── permissions.ts            # Permission checking functions
│   │   └── email.ts                  # Email notification utilities
│   └── types/                        # TypeScript definitions
│       └── index.ts                  # Core data models and interfaces
├── data/                             # Database storage
│   └── orion.db                      # SQLite database file
├── public/                           # Static assets
│   └── favicon.svg                   # Sparkle favicon (yellow)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── middleware.ts                     # Route protection middleware
```

## Core Concepts

### Data Models

- **User**: System users with authentication credentials, roles (admin/user/viewer), and profile information
- **Team**: Groups of users organized by function or domain with team owners and custom colors
- **DateAssignment**: Scheduling data linking teams and users to specific dates with notes
- **Shadow**: Mentorship relationships where one user shadows another for training with date ranges
- **Incident**: Issue tracking with severity levels, status workflow, team assignment, and timeline

### User Roles & Permissions

- **Admin**: Full system access - manage all users, teams, assignments, and incidents
- **User**: Standard access - manage own profile, create assignments and incidents, view all data
- **Viewer**: Read-only access - view all data but cannot create or modify anything

### Key Components

- **CalendarView**: Interactive weekly calendar grid showing on-call assignments per day
- **IncidentList**: Card-based incident tracking with filtering, search, and webhook testing
- **UserList**: User management interface with role badges and permission-based actions
- **TeamList**: Team overview with members, owners, and expansion panels
- **ShadowList**: Shadow assignment management with search and duplicate detection
- **AnalyticsView**: Statistical analysis with charts and CSV export capabilities

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Tech Stack

- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript 5+ with strict mode
- **Database**: SQLite with better-sqlite3 (WAL mode)
- **Authentication**: Session-based with bcrypt password hashing
- **Styling**: Tailwind CSS 3+ with dark mode support
- **Icons**: Lucide React (600+ icons)
- **Date Utilities**: date-fns for date manipulation and formatting
- **HTTP Client**: Native fetch API with Next.js enhancements

## Webhook Integration

Project Orion supports webhook integrations from popular monitoring tools. Admins can use the built-in webhook tester to send test alerts.

### Supported Formats

- **Prometheus AlertManager**: Standard Prometheus alert format
- **Grafana**: Grafana alert notifications
- **Dynatrace**: Dynatrace problem notifications
- **Generic**: Custom JSON payloads

### Webhook Endpoint

```
POST http://localhost:3000/api/webhooks/alerts
Content-Type: application/json
```

### Example Payload (Prometheus)

```json
{
  "alerts": [
    {
      "fingerprint": "alert_12345",
      "labels": {
        "alertname": "HighCPUUsage",
        "severity": "critical",
        "instance": "server-01"
      },
      "annotations": {
        "summary": "CPU usage above 90%",
        "description": "Server server-01 CPU usage is at 95%"
      },
      "status": "firing"
    }
  ]
}
```

The webhook will automatically create incidents with appropriate severity mapping and team assignment based on configured rules.

## Data Persistence

Project Orion uses SQLite with WAL mode for production-ready local data persistence. All data is stored in `data/orion.db` and persists across sessions. The database is automatically created and initialized with sample data on first run.

### Database Schema

#### Core Tables
- **users**: User authentication, profiles, roles (admin/user/viewer), and contact information
- **sessions**: Session management for authentication with secure tokens
- **teams**: Team definitions with names, descriptions, colors, and timestamps
- **team_owners**: Junction table linking teams to their owner users
- **team_members**: Junction table for team memberships
- **date_assignments**: On-call schedule assignments with dates, teams, and notes
- **assignment_users**: Junction table for assignment-user relationships
- **shadows**: Shadow assignments with primary/shadow user pairs and date ranges
- **incidents**: Issue tracking with severity, status, team assignment, and metadata
- **incident_notes**: Timeline notes for incidents with user attribution

#### Deprecated Tables
- **members**: Deprecated - migrated to `users` table (automatically dropped on initialization)

### Authentication & Security

- **Session Tokens**: Secure session-based authentication using HTTP-only cookies
- **Password Hashing**: Bcrypt-based password hashing for local authentication
- **OAuth Support**: Framework for OAuth providers (Google, GitHub) - ready for implementation
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **Middleware Protection**: Route-level authentication enforcement

## Roadmap

### Completed ✅
- [x] User authentication with session management
- [x] Role-based access control (Admin, User, Viewer)
- [x] User and team management with CRUD operations
- [x] Calendar-based assignment scheduling
- [x] Shadow assignment system for mentorship tracking
- [x] Incident management with status workflow
- [x] Webhook integration for monitoring tools
- [x] Notes and timeline for incidents with user attribution
- [x] Analytics dashboard with statistics and CSV export
- [x] SQLite database with automatic migration
- [x] Mobile responsive design with dark mode
- [x] Search functionality across all entities
- [x] Profile avatars with auto-generated fallbacks
- [x] Permission system with server-side validation
- [x] Auto-assignment when starting incidents
- [x] Duplicate detection for assignments and shadows
- [x] Team switching within edit modals

### In Progress 🚧
- [ ] OAuth integration (Google, GitHub)
- [ ] Email notifications for incidents and assignments
- [ ] LDAP authentication support

### Planned 📋
- [ ] Export schedule to calendar formats (iCal, Google Calendar)
- [ ] SMS notifications for critical incidents
- [ ] Mobile app (React Native)
- [ ] Incident escalation workflows
- [ ] On-call rotation templates
- [ ] Shift swap requests and approvals
- [ ] Integration with Slack/Teams
- [ ] Advanced reporting and dashboards
- [ ] Multi-tenant support
- [ ] Audit logging
- [ ] Multi-language support (i18n)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author & Credits

**Created by [Ing. Johanna Rührig](https://vira.solutions)**

Project Orion is an on-call management dashboard built with modern web technologies to help teams organize and track on-call duties efficiently.

- 🌐 Website: [https://vira.solutions](https://vira.solutions)
- 💻 GitHub: [@TheRealVira](https://github.com/TheRealVira)
- 📦 Repository: [Project-Orion](https://github.com/TheRealVira/Project-Orion)

## License

See [LICENSE](LICENSE) file for details.
