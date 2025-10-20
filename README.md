# Project Orion ✨

[![CI](https://github.com/TheRealVira/Project-Orion/actions/workflows/ci.yml/badge.svg)](https://github.com/TheRealVira/Project-Orion/actions/workflows/ci.yml)
[![Build and Release](https://github.com/TheRealVira/Project-Orion/actions/workflows/build-release.yml/badge.svg)](https://github.com/TheRealVira/Project-Orion/actions/workflows/build-release.yml)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/TheRealVira/Project-Orion/pkgs/container/project-orion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/TheRealVira/Project-Orion/blob/main/LICENSE)

A modern on-call companion dashboard for managing teams, schedules, incidents, and shadow assignments with enterprise-grade features.

## 📑 Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [First Time Setup](#first-time-setup)
  - [Quick Start Guide](#quick-start-guide)
- [Package Manager Migration to pnpm](#package-manager-migration-to-pnpm)
- [Webhook Integration](#webhook-integration)
- [Email & SMS Notifications](#email--sms-notifications)
- [Authentication](#authentication)
- [Database](#database)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [CI/CD & Releases](#cicd--releases)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author & Credits](#author--credits)
- [License](#license)

## Features

### 👥 User & Team Management
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
- **Email Notifications**: Automatic email alerts for incident creation and assignments
- **SMS Notifications**: Optional SMS alerts for critical incidents via Twilio (disabled by default)

### ⏱️ SLA Tracking & Management
- **Team-Level SLA Configuration**: Each team can define custom SLA targets for response and resolution times
- **Severity-Based Targets**: Configure different SLA targets based on incident severity (critical, high, medium, low)
- **Business Hours Support**: Option to calculate SLA only during business hours with customizable schedules
- **Timezone-Aware**: Support for multiple timezones to accommodate global teams
- **Automatic Deadline Calculation**: SLA deadlines are automatically calculated when incidents are created
- **Real-Time Tracking**: Visual progress indicators show time remaining until SLA breach
- **Breach Detection**: Automatic detection and flagging of SLA breaches for response and resolution times
- **At-Risk Alerts**: Early warning system when SLA targets are >80% consumed
- **Email Notifications**: Automatic alerts sent to assigned users when SLAs are at risk or breached
- **Visual Indicators**: Color-coded badges and progress bars display SLA status on incident lists and details
- **Background Monitoring**: Scheduled checks for SLA compliance with automated notifications

### 📈 SLA Dashboard & Analytics
- **Comprehensive SLA Dashboard**: Dedicated dashboard for monitoring SLA performance with real-time metrics
- **Visual Pie Charts**: Donut-style pie charts showing response and resolution SLA compliance at a glance
- **Trend Analysis**: Interactive line and bar charts displaying SLA trends over time (7, 30, 60, or 90 days)
- **Multi-Chart Visualization**: 
  - Incident Volume trends with per-team breakdown
  - SLA Compliance rates for response and resolution
  - Average response and resolution times tracking
- **Interactive Charts**: Hover anywhere on trend lines to see detailed data points with cursor tracking
- **Toggle Chart Types**: Seamlessly switch between line and bar charts with animated toggle controls
- **Team Filtering**: Filter all metrics and trends by specific teams or view overall performance
- **Missing Data Handling**: Automatically fills gaps in trend data (0 for counts, 100% for compliance)
- **Data Export**: Export SLA metrics and trend data to CSV for external reporting and analysis
- **Responsive Design**: Full mobile support with optimized chart rendering for all screen sizes

### 📊 Analytics & Reporting
- **Assignment Statistics**: View detailed assignment statistics with customizable date ranges
- **Workload Distribution**: Analyze assignment counts per member with visual progress bars
- **Team Analytics**: Filter statistics by teams and members
- **CSV Export**: Export analytics data for external reporting and analysis
  - Analytics: Assignment statistics and workload distribution
  - Calendar: On-call schedules with date ranges
  - SLA Dashboard: SLA metrics, compliance rates, and trend data
- **Member Comparison**: Compare assignment distribution across team members
- **Date Range Selection**: Flexible date filtering for historical analysis

### 🌍 Global Team Map
- **Interactive World Map**: Visualize team members' locations and timezones across the globe
- **User Locations**: View team members positioned on an interactive world map with pins
- **Timezone Grouping**: Automatically group users by timezone for easy scheduling
- **Location Details**: Click on team members to view detailed location and timezone information
- **On-Call Status**: Visual indicators show current on-call status for each team member
- **Searchable**: Find team members by location or timezone quickly
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🎨 Modern Design System & Glassmorphism
- **Glassmorphism UI**: Premium frosted glass design pattern with advanced visual effects
  - Transparent backgrounds with sophisticated blur effects
  - Refined semi-transparent borders for glass-like appearance
  - Smooth gradient overlays and depth layering
  - Professional backdrop blur on all modals and overlays
  - Inset shadows creating glass refraction illusions
- **Smooth Animations**: Fluid interactions and animated transitions
  - Animated indicators on interactive toggle controls
  - Smooth line and bar chart transitions with Recharts
  - Frictionless button and modal interactions
  - Responsive hover states with backdrop blur effects
- **Premium Visual Effects**: Multi-layered shadow system for depth
  - Elevated UI components with realistic shadow stacking
  - Combined inset and outset shadows for glass effect
  - Layered shadows adapting to light/dark modes
  - Enhanced contrast and visual hierarchy

### 🔍 User Experience
- **Intuitive Navigation**: Organized tab structure (Dashboard → Calendar → Shadowing → Analytics → SLA → Incidents)
- **Search Functionality**: Fast search across users, teams, incidents, and shadow assignments
- **Smart Pagination**: Auto-hiding pagination for incidents, users, teams, and shadow assignments
  - Configurable page sizes (10, 20, 50, 100 items)
  - Automatically hides when all items fit on one page
  - Smooth page transitions with scroll-to-top
  - Persists through search and filter operations
- **Mobile Responsive**: Fully optimized for mobile, tablet, and desktop devices with responsive layouts
- **Dark Mode**: Built-in dark mode support with persistent theme preference
- **Real-time Updates**: Changes reflect immediately across all views
- **Smart Notifications**: Visual alerts for important actions and state changes
- **Interactive Charts**: Hover tooltips, animated toggles, and responsive visualizations

### 🔒 Security & Permissions
- **Session Management**: Secure session-based authentication with HTTP-only cookies
- **Permission System**: Granular permission checks for all CRUD operations
- **User Attribution**: All actions are attributed to the performing user in logs and timelines
- **Protected Routes**: Middleware-based route protection for authenticated areas
- **Role Enforcement**: Server-side role validation for sensitive operations
- **Multiple Auth Methods**: Local authentication, OAuth (Google, GitHub, Microsoft, GitLab), and LDAP/Active Directory

### 💾 Database & Performance
- **SQLite with WAL Mode**: Production-ready database with better concurrency
- **Automatic Migrations**: Schema automatically migrates and drops deprecated tables
- **Persistent Storage**: All data persists across sessions with file-based storage
- **Optimized Queries**: Indexed queries for fast lookups
- **ACID Compliance**: Transaction support for data integrity

## Getting Started

### Prerequisites

- **Option 1 (Docker)**: Docker and Docker Compose
- **Option 2 (Local)**: Node.js 20.0.0+ and pnpm 9.0.0+ (npm and yarn also supported)
- A modern web browser

**Package Manager Setup:**
This project uses **pnpm** as the preferred package manager for better performance and disk space efficiency. Install pnpm globally:

```bash
npm install -g pnpm@latest
# or using Homebrew (macOS)
brew install pnpm
# or using Chocolatey (Windows)
choco install pnpm
```

Check your installation:
```bash
pnpm --version  # Should be 9.0.0 or higher
node --version  # Should be 20.0.0 or higher
```

### Installation

#### 🐳 Docker Deployment (Recommended)

**Quick start with Docker Compose:**
```bash
git clone https://github.com/TheRealVira/Project-Orion.git
cd Project-Orion
docker-compose up -d
```

Access at http://localhost:3000 with default credentials.

#### 💻 Local Development

1. Clone the repository:
```bash
git clone https://github.com/TheRealVira/Project-Orion.git
cd Project-Orion
```

2. Install dependencies:

**This project uses pnpm for dependency management** (v9.0.0+). While npm and yarn are still supported, pnpm is recommended for faster installations and better disk space utilization.

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

3. Run the development server:
```bash
# Using pnpm (recommended)
pnpm dev

# Or using npm
npm run dev

# Or using yarn
yarn dev
```

4. Configure environment (optional):
```bash
cp .env.example .env
# Edit .env to customize settings
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

Project Orion works out of the box with smart defaults. Configuration is optional but allows you to customize authentication, notifications, and integrations.
```bash
# Copy example configuration
cp .env.example .env

# Essential settings (optional - defaults work out of the box)
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_PATH=./orion.db
LOG_LEVEL=info

# Feature flags (most enabled by default, SMS disabled)
ENABLE_WEBHOOKS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_OAUTH=true
ENABLE_LDAP=true

# Email (optional - disabled if not configured)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS (optional - disabled by default)
# ENABLE_SMS_NOTIFICATIONS=true
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your_auth_token
# TWILIO_FROM_NUMBER=+1234567890

# OAuth (optional - see .env.example for all providers)
# OAUTH_GOOGLE_CLIENT_ID=your_client_id
# OAUTH_GOOGLE_CLIENT_SECRET=your_client_secret

# LDAP (optional - for Active Directory/OpenLDAP)
# ENABLE_LDAP=true
# LDAP_URL=ldap://ldap.company.com:389
# LDAP_BIND_DN=cn=admin,dc=company,dc=com
# LDAP_BIND_PASSWORD=your_password
# LDAP_SEARCH_BASE=ou=users,dc=company,dc=com
```

**✨ Key Features:**
- Works out of the box without any configuration
- Features auto-disable if dependencies are missing
- Startup warnings for production configuration issues
- Supports multiple authentication methods simultaneously

### First Time Setup

On first run, the application will:
1. Create the SQLite database at `data/orion.db`
2. Initialize the database schema
3. Seed sample data (users, teams, assignments)
4. Create a default admin user

**Default Admin Credentials:**
- Email: `admin@orion.local` (configurable via `DEFAULT_ADMIN_EMAIL`)
- Password: `admin123` (configurable via `DEFAULT_ADMIN_PASSWORD`)
- **⚠️ Change these immediately in production!**

You can customize the default admin user by setting these environment variables in your `.env` file:
```env
DEFAULT_ADMIN_EMAIL=admin@orion.local
DEFAULT_ADMIN_NAME=Administrator
DEFAULT_ADMIN_PASSWORD=admin123
```

### Quick Start Guide

1. **Login**: Use the default admin credentials or create a new account
2. **Create Users**: Navigate to the "Users" tab and add team members
3. **Create Teams**: Go to "Teams" tab and organize users into teams
4. **Configure SLAs**: Set up SLA targets for each team (optional, defaults provided)
5. **Schedule Assignments**: Use the "Calendar" tab to assign on-call duties
6. **Track Incidents**: Switch to "Incidents" tab to manage ongoing issues
7. **Monitor SLAs**: Check "SLA" tab for real-time SLA compliance and trend analysis
8. **Setup Shadows**: Use "Shadows" tab to pair experienced members with new ones
9. **View Analytics**: Check "Analytics" tab for workload distribution insights

## Package Manager Migration to pnpm

### 🎉 What Changed

Project Orion has migrated from npm to **pnpm** for improved performance and disk space efficiency. This migration includes:

✅ **Benefits:**
- ⚡ **3x faster** installations
- 💾 **50% less disk space** used for dependencies
- 🔒 **Stricter dependency resolution** for better security
- 📦 **Monorepo-ready** with pnpm workspaces
- 🌳 **Flat node_modules** structure (when using symlinks or hoisting)

### Updated Configuration Files

The following files were updated for pnpm compatibility:

- **`.npmrc`**: Registry settings and timeout configurations for reliable installations
- **`package.json`**: Engine requirement now specifies `pnpm >=9.0.0`
- **`Dockerfile`**: Multi-stage build now uses pnpm with global installation
- **`GitHub Actions`**: CI/CD workflows updated to use pnpm/action-setup
- **`.gitignore`**: Added pnpm-specific cache patterns and build artifacts
- **`pnpm-lock.yaml`**: Lock file generated with all 590+ dependencies frozen

### Migration Guide

If you were previously using npm or yarn:

```bash
# 1. Remove old lock files
rm package-lock.json yarn.lock

# 2. Clear old caches
npm cache clean --force
pnpm store prune

# 3. Install with pnpm
pnpm install

# 4. Verify installation
pnpm --version  # Should be 9.0.0+
pnpm list       # Verify all dependencies
```

### Troubleshooting

**Issue: `ERR_SOCKET_TIMEOUT` during installation**
- Solution: Check `.npmrc` configuration or increase timeout values
- File: `.npmrc` with fetch-timeout=60000 and fetch-retries=5

**Issue: Build tools missing for native modules**
- Solution: Ensure build tools are installed (Python, gcc, make, etc.)
- Windows: Visual Studio Build Tools or node-gyp
- macOS: Xcode Command Line Tools
- Linux: build-essential package

**Issue: Module resolution errors**
- Solution: Run `pnpm install --force` to rebuild dependencies
- Or: Delete `node_modules` and `pnpm-lock.yaml`, then run `pnpm install`

### Available Package Manager Commands

All standard npm commands work with pnpm:

```bash
# Installation
pnpm install              # Install all dependencies
pnpm add <package>        # Add a new package
pnpm add -D <package>     # Add as dev dependency
pnpm add -g <package>     # Install globally

# Updates
pnpm update               # Update all packages
pnpm update <package>     # Update specific package

# Maintenance
pnpm prune                # Remove unused dependencies
pnpm audit                # Security audit
pnpm audit --fix          # Auto-fix vulnerabilities
```

## Webhook Integration

Project Orion supports webhook integrations from popular monitoring tools. Admins can use the built-in webhook tester to send test alerts.

### Configuration

**Enable Webhooks:**
```bash
ENABLE_WEBHOOKS=true  # Enabled by default
```

**Secure Webhooks (Optional):**
```bash
# Set a webhook secret for signature verification
WEBHOOK_SECRET=your-random-secret-key

# Webhooks must include these headers:
# x-webhook-signature: HMAC-SHA256(timestamp + body)
# x-webhook-timestamp: Unix timestamp in milliseconds
```

### Supported Formats

- **Prometheus AlertManager**: Standard Prometheus alert format
- **Grafana**: Grafana alert notifications
- **Dynatrace**: Dynatrace problem notifications
- **Generic**: Custom JSON payloads

### Webhook Endpoint

```
POST http://localhost:3000/api/webhooks/alerts
Content-Type: application/json
x-webhook-signature: <signature>  # Optional, required if WEBHOOK_SECRET set
x-webhook-timestamp: <timestamp>  # Optional, required if WEBHOOK_SECRET set
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
        "instance": "server-01",
        "team": "Product A"
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

### Smart Team & Member Assignment

Webhooks use intelligent cascading logic to assign incidents:

**Team Assignment:**
1. **Tag Matching**: Matches alert tags/labels to team names (case-insensitive)
   - Example: `team: "product a"` → Matches "Product A" team
   - Checks: `team`, `service`, `product`, `component`, `app`, `application` fields
2. **On-Call Schedule**: Uses today's on-call team if no tag match
3. **First Available**: Assigns to first available team if no one is on-call

**Member Assignment (within matched team):**
1. **Today's On-Call**: Assigns to member on-call today for that team
2. **Team Owner**: Assigns to team owner if no one is on-call
3. **Any Team Member**: Assigns to first team member if no owner
4. **Team Only**: Assigns to team without specific member if team is empty

This ensures alerts are never lost and always reach the right people! 🎯

## Email & SMS Notifications

### Email Notifications

Project Orion sends beautiful HTML email notifications for important events:

**Supported Events:**
- 🚨 **Incident Created** (via webhook) - Notifies assigned team/member
- 👤 **Incident Assigned** (manual) - Notifies newly assigned member
- 📅 **Calendar Assignment** (new) - Notifies assigned members of new on-call duty
- ✏️ **Calendar Assignment** (updated) - Notifies members of schedule changes
- 🗑️ **Calendar Assignment** (removed) - Notifies members when removed from schedule

**Configuration:**
```bash
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# From Address
FROM_EMAIL=orion@example.com
FROM_NAME=Project Orion

# Enable/Disable
ENABLE_EMAIL_NOTIFICATIONS=true
```

**Email Features:**
- ✨ Beautiful HTML templates with gradient headers
- 🎨 Severity-based color coding for incidents
- 📱 Mobile-responsive design
- 🔗 Branded footer with Ko-fi, GitHub, and license links
- ⚡ Non-blocking: email failures don't prevent operations

### SMS Notifications

SMS notifications provide urgent alerts for critical incidents via Twilio.

**Configuration (Disabled by Default):**
```bash
# Enable SMS
ENABLE_SMS_NOTIFICATIONS=true

# Twilio Settings
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
SMS_PROVIDER=twilio
```

**Setup Instructions:**
1. Sign up at [twilio.com](https://www.twilio.com/)
2. Go to Console → Account Info
3. Copy your Account SID and Auth Token
4. Purchase a phone number or use trial number
5. Add credentials to your `.env` file
6. Set `ENABLE_SMS_NOTIFICATIONS=true`

**SMS Features:**
- 📱 Concise messages optimized for SMS (< 160 characters)
- 🎯 Severity-based emoji indicators (🔴 critical, 🟠 high, etc.)
- 🔗 Direct links to incident details
- ⚙️ Support for multiple providers (Twilio, Vonage, AWS SNS)
- 🚫 Disabled by default - opt-in only
- ⚡ Non-blocking: SMS failures don't prevent operations

**Supported Events:**
- 🚨 Critical incident creation (webhook alerts)
- 👤 Incident assignment to member
- 📅 On-call duty assignments

**Note**: Twilio trial accounts can only send to verified phone numbers. Upgrade to production for unrestricted sending.

## Authentication

Project Orion supports multiple authentication methods that can be enabled simultaneously:

### 🔑 Local Authentication
- Username/password with bcrypt hashing
- Always enabled by default
- Admin credentials configurable via environment variables

### 🌐 OAuth Providers
Supported OAuth providers (configure via environment variables):
- **Google**: Google Workspace and Gmail accounts
- **GitHub**: GitHub user accounts
- **Microsoft**: Azure AD and Microsoft accounts
- **GitLab**: GitLab.com and self-hosted instances
- **Custom OIDC**: Any OpenID Connect compatible provider

### 🏢 LDAP/Active Directory
Enterprise directory authentication:
- **Active Directory**: Microsoft AD with sAMAccountName
- **OpenLDAP**: Standard LDAP with uid
- Auto-creates users as 'viewer' role on first login
- Configurable attribute mapping

**LDAP Configuration:**
```bash
ENABLE_LDAP=true
LDAP_URL=ldap://ad.company.com:389
LDAP_BIND_DN=CN=Service Account,DC=company,DC=com
LDAP_BIND_PASSWORD=your_password
LDAP_SEARCH_BASE=DC=company,DC=com
LDAP_SEARCH_FILTER=(sAMAccountAccount={{username}})
```

### User Roles
- **Admin**: Full system access - manage users, teams, all assignments and incidents
- **User**: Standard access - create/manage own assignments, incidents, and shadows
- **Viewer**: Read-only - view all data but cannot create or modify

## Database

Project Orion uses SQLite with WAL mode for production-ready data persistence. The database is automatically created and initialized on first run.

### Core Tables
- **users**: Authentication, profiles, roles, and contact information
- **sessions**: Session tokens for authentication
- **teams**: Team definitions with colors and descriptions
- **team_owners** & **team_members**: Team relationships
- **date_assignments** & **assignment_users**: On-call schedule data
- **shadows**: Mentorship/training assignments
- **incidents** & **incident_notes**: Issue tracking with timeline

### Security Features
- **HTTP-only cookies**: Secure session tokens
- **Bcrypt hashing**: Password encryption
- **CSRF protection**: Built-in request forgery prevention
- **Webhook signatures**: HMAC-SHA256 verification (optional)
- **Route protection**: Middleware-based authentication enforcement

## Development

### Tech Stack
- **Framework**: Next.js 14 (App Router) with React 18 and TypeScript 5+
- **Database**: SQLite with better-sqlite3 (WAL mode)
- **Package Manager**: pnpm 9.0.0+ (npm and yarn also supported)
- **Styling**: Tailwind CSS 3+ with dark mode support
- **Charts**: Recharts for interactive data visualization
- **Icons**: Lucide React
- **Authentication**: bcrypt, OAuth, LDAP (ldapjs)
- **Notifications**: nodemailer (email), Twilio (SMS)
- **Utilities**: date-fns for date handling

### UI Components

Modern, reusable components with glassmorphic design and smooth animations:

- **ChartToggle**: Animated toggle for switching between chart types
  - Smooth sliding indicator with glass effect
  - Click-anywhere functionality
  - Full accessibility support (ARIA)
  - Responsive and mobile-optimized
  
- **Toggle**: Interactive switch component with glassmorphism
  - Transparent background with backdrop blur
  - Glass-like border and refraction effects
  - Smooth state transitions
  - Dark mode support

- **Modal**: Premium modal dialogs with glass design
  - Frosted glass appearance with backdrop blur
  - Semi-transparent border with inset shadows
  - Multi-layered shadow system
  - Smooth open/close animations
  - Mobile-optimized (bottom sheet on mobile, center on desktop)

- **Button**: Accessible button components
  - Multiple size and style variants
  - Smooth hover states with backdrop effects
  - Loading states with spinner
  - Full keyboard navigation support

- **Card**: Container component for content sections
  - Flexible layout options
  - Optional glass effect styling
  - Responsive padding and spacing
  - Dark mode compatible

- **WorldMap**: Interactive global team visualization
  - Beautiful map rendering with user location pins
  - Timezone information display
  - On-call status indicators
  - Responsive to all screen sizes

- **Additional Components**: Badge, Select, EmptyState, LoadingSpinner, ConfirmationModal, LocationInput, UserCard, WebhookTesterModal

### Available Scripts

Using pnpm (recommended):
```bash
pnpm dev            # Start development server
pnpm build          # Build for production
pnpm start          # Start production server
pnpm lint           # Run ESLint
pnpm type-check     # TypeScript type checking
pnpm audit          # Security audit of dependencies
```

Or using npm:
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
npm audit           # Security audit of dependencies
```

### Project Structure
```
src/
├── app/              # Next.js pages and API routes
├── components/       # React components
├── contexts/         # React contexts (Auth)
├── lib/              # Business logic (auth, database, email, sms)
└── types/            # TypeScript definitions
```

### Package Manager Notes

**Why pnpm?**
- ⚡ **3x faster** installations compared to npm
- 💾 **Saves disk space** with efficient dependency deduplication
- 🔒 **Better security** with stricter dependency resolution
- 📦 **Monorepo support** with pnpm workspaces
- 🌐 **Seamless migration** from npm or yarn

**Migrating from npm/yarn to pnpm:**
```bash
# Remove old lock files
rm package-lock.json yarn.lock

# Clear caches
pnpm store prune

# Install with pnpm
pnpm install
```

## Docker Deployment

Project Orion includes production-ready Docker support with multi-stage builds for optimized image size.

### Quick Start with Docker Compose

```bash
# Clone and start
git clone https://github.com/TheRealVira/Project-Orion.git
cd Project-Orion
docker-compose up -d

# View logs
docker-compose logs -f orion

# Stop
docker-compose down
```

### Features
- 🐳 **Multi-stage build**: Optimized production image (~200MB)
- 📦 **Persistent storage**: Database stored in Docker volume
- 🔒 **Non-root user**: Runs as unprivileged user for security
- 💚 **Health checks**: Built-in container health monitoring
- ⚙️ **Easy configuration**: All settings via environment variables

### Configuration

Edit `docker-compose.yml` to configure:
- Admin credentials (⚠️ change `DEFAULT_ADMIN_PASSWORD`!)
- Application URL
- Email, SMS, OAuth, LDAP settings
- Feature flags

## CI/CD & Releases

### Automated Builds with pnpm

Project Orion uses GitHub Actions for continuous integration and automated releases with full pnpm support:

#### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches:

```yaml
✅ Lint & Test Job
├── Checkout code
├── Setup pnpm (v10.18.3+)
├── Setup Node.js (v20+)
├── Cache pnpm store for faster builds
├── Install dependencies with frozen lockfile
├── Run ESLint checks
├── Build verification
└── Run type checks

✅ Security Audit Job (Separate)
├── Run pnpm audit with moderate risk level
├── Generate security report
├── Continue on error (non-blocking)

✅ Docker Build Job
├── Build Docker image with pnpm
├── Test multi-stage build
└── Verify image integrity
```

**Key Features:**
- Frozen lockfile enforcement (`--frozen-lockfile`) prevents version drifts
- Separate security audit job doesn't block build pipeline
- pnpm caching reduces installation time by ~80%
- Multi-job parallelization for faster feedback

#### Release Pipeline (`.github/workflows/build-release.yml`)

Triggered by version tags (`v*.*.*`):

```yaml
✅ Test Job (Pre-release validation)
├── Run all tests with pnpm
├── Verify build succeeds
└── Ensure no regressions

✅ Build Docker Job (Multi-platform)
├── Build for linux/amd64 (Intel/AMD)
├── Build for linux/arm64 (Apple Silicon, Raspberry Pi)
├── Push to ghcr.io
└── Generate SBOMs

✅ Build Artifacts Job
├── Create standalone package (.tar.gz)
├── Create deployment package with Docker files
├── Upload to release page
└── Generate release notes
```

**Release Platforms:**
- `linux/amd64` - x86_64 (Intel/AMD servers)
- `linux/arm64` - ARM64 (Apple Silicon, Raspberry Pi 4+, AWS Graviton)

#### Workflow Benefits

- 🔒 **Security**: pnpm audit ensures dependencies are safe
- ⚡ **Speed**: pnpm caching + frozen lockfile = faster builds
- 🔄 **Consistency**: Lockfile ensures reproducible builds
- 📦 **Reliability**: Multi-stage builds with dependency verification
- 📊 **Transparency**: Detailed logs and build artifacts

### Docker Images

Pre-built Docker images are available on GitHub Container Registry:

```bash
# Pull latest stable release
docker pull ghcr.io/therealvira/project-orion:latest

# Pull specific version
docker pull ghcr.io/therealvira/project-orion:v0.1.0

# Pull latest commit from main branch
docker pull ghcr.io/therealvira/project-orion:main
```

**Supported platforms:**
- `linux/amd64` - x86_64 (Intel/AMD)
- `linux/arm64` - ARM64 (Apple Silicon, Raspberry Pi 4+, ARM servers)

### Creating a Release

```bash
# 1. Update version with pnpm
pnpm version patch  # or minor, or major

# 2. Create and push tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin main
git push origin vX.Y.Z
```

This automatically triggers the build and release pipeline.

### Release Artifacts

Each release includes:
- 🐳 **Docker images** (multi-platform)
- 📦 **Standalone package** (.tar.gz with built application)
- 🚀 **Deployment package** (.tar.gz with Docker files and configs)

Download from [Releases](https://github.com/TheRealVira/Project-Orion/releases) page.

## Roadmap

### ✅ Completed Features
- **Core Functionality**
  - User authentication (local, OAuth, LDAP) with role-based access control
  - Team management with owners and member assignments
  - Calendar-based on-call scheduling with duplicate detection
  - Shadow assignment system for mentorship/training
  - Incident management with status workflow and auto-assignment
  - Analytics dashboard with CSV export and weekday breakdown
  - **SLA tracking and management** with business hours support and automatic breach detection ([docs](./SLA_IMPLEMENTATION.md))
  - **SLA Dashboard** with interactive charts, trend analysis, and team filtering
    - Visual pie charts for response and resolution SLA compliance
    - Interactive line and bar charts with animated toggles
    - Multi-chart visualization (incident volume, compliance rates, response times)
    - CSV export for SLA metrics and trend data
  - **Global Team Map** for visualizing team members across locations and timezones
    - Interactive world map with user location pins
    - Timezone grouping and filtering
    - On-call status indicators
    - Responsive design for all devices

- **User Interface & Design**
  - **Premium Glassmorphism Design System**
    - Frosted glass UI with backdrop blur effects
    - Semi-transparent borders with glass-like appearance
    - Multi-layered shadow system for depth perception
    - Gradient overlays and smooth transitions
  - **Smooth Animations & Interactions**
    - Animated toggle controls with sliding indicators
    - Fluid chart transitions (line/bar chart toggles)
    - Frictionless UI interactions with hover states
    - Professional backdrop blur on modals and overlays

- **Integrations**
  - Webhook support for Prometheus, Grafana, Dynatrace, and custom alerts
  - Smart incident assignment with tag matching and cascading fallback
  - Email notifications for all incidents and calendar assignments
  - SMS notifications via Twilio (optional, disabled by default)
  - OAuth providers: Google, GitHub, Microsoft, GitLab, Custom OIDC
  - LDAP/Active Directory authentication

- **User Experience**
  - Mobile responsive design with dark mode
  - **Smart pagination** across all major lists with auto-hide and configurable page sizes ([docs](./PAGINATION_IMPLEMENTATION.md))
  - **Reusable UI components** (ChartToggle, Toggle, Modal with glass effects)
  - Interactive data visualization with Recharts
  - Search functionality across all entities
  - Profile avatars with auto-generated fallbacks
  - Permission system with server-side validation
  - Timeline and notes for incident tracking
  - CSV export across Analytics, Calendar, and SLA dashboards

### 📋 Planned Features
- **Scheduling Enhancements**
  - Export to calendar formats (iCal, Google Calendar)
  - On-call rotation templates and auto-scheduling
  - Shift swap requests and approvals

- **Incident Management**
  - Escalation workflows and policies
  - Incident postmortem templates and reports
  - Multi-team incident collaboration
  - Incident templates

- **Integrations**
  - Slack/Microsoft Teams notifications
  - PagerDuty integration
  - Jira/GitHub issue linking

- **Enterprise Features**
  - Multi-tenant support
  - Audit logging
  - Advanced reporting and custom dashboards
  - Multi-language support (i18n)

- **Mobile**
  - Native mobile app (React Native)
  - Push notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author & Credits

**Created by [Ing. Johanna Rührig](https://vira.solutions)**

Project Orion is an on-call management dashboard built with modern web technologies to help teams organize and track on-call duties efficiently.

- 🌐 Website: [https://vira.solutions](https://vira.solutions)
- 💻 GitHub: [@TheRealVira](https://github.com/TheRealVira)
- 📦 Repository: [Project-Orion](https://github.com/TheRealVira/Project-Orion)
- ☕ Ko-fi: [https://ko-fi.com/vira](https://ko-fi.com/vira)

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/TheRealVira/Project-Orion/blob/main/LICENSE) file for details.
