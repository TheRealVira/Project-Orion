# SLA Tracking Implementation

## Overview
This document describes the SLA (Service Level Agreement) tracking feature implemented in Project Orion. The feature allows teams to define and track response and resolution time targets for incidents based on severity levels.

## Features

### 1. **Team-Level SLA Configuration**
- Each team can have their own SLA settings
- Configurable via the team management interface (SLA button)
- Can be enabled/disabled per team
- Managed by team owners and admins

### 2. **Severity-Based Targets**
SLA targets can be configured independently for each severity level:
- **Critical**: Highest priority, shortest response/resolution times
- **High**: High priority incidents
- **Medium**: Standard priority incidents
- **Low**: Lower priority incidents

Each severity level has two configurable targets:
- **Response Time**: Time until first response/acknowledgment
- **Resolution Time**: Time until incident is closed

### 3. **Business Hours Support**
- **24/7 Mode**: Calculate SLA based on calendar time (default)
- **Business Hours Mode**: Only count time during business hours
  - Configurable start/end times (e.g., 09:00-17:00)
  - Selectable business days (e.g., Monday-Friday)
  - Timezone-aware calculations
  - Automatically skips weekends and non-business hours

### 4. **Automatic Tracking**
- SLA deadlines calculated automatically when incidents are created
- First response time tracked when incident status changes to "in_progress"
- Resolution time tracked when incident is closed
- Breach flags updated automatically
- All calculations respect business hours settings

### 5. **Visual Indicators**
- **Compact badges** in incident lists showing:
  - Time remaining or "Overdue"
  - Response and resolution status
  - Color-coded (blue → orange → red)
  
- **Detailed progress bars** in incident detail view showing:
  - Percentage of time elapsed
  - Exact deadlines
  - Visual progress indicators
  - Met/Breached/At Risk status

### 6. **Notifications**
- **At-Risk Warnings**: Sent when >80% of SLA time has elapsed
- **Breach Alerts**: Sent immediately when SLA deadline is exceeded
- Notifications sent via email to assigned user
- Includes incident details and time remaining
- Supports both response and resolution SLA notifications

### 7. **Background Monitoring**
- API endpoint `/api/sla/check` performs periodic SLA checks
- Can be called by cron jobs or scheduled tasks
- Checks all open incidents with SLA settings
- Updates breach flags in database
- Sends notifications for breaches and at-risk incidents
- Returns summary of checks performed

## Database Schema

### `team_sla_settings` Table
```sql
CREATE TABLE team_sla_settings (
  id TEXT PRIMARY KEY,
  teamId TEXT NOT NULL UNIQUE,
  responseTimeCritical INTEGER NOT NULL,      -- minutes
  responseTimeHigh INTEGER NOT NULL,
  responseTimeMedium INTEGER NOT NULL,
  responseTimeLow INTEGER NOT NULL,
  resolutionTimeCritical INTEGER NOT NULL,    -- minutes
  resolutionTimeHigh INTEGER NOT NULL,
  resolutionTimeMedium INTEGER NOT NULL,
  resolutionTimeLow INTEGER NOT NULL,
  businessHoursOnly INTEGER NOT NULL DEFAULT 0,
  businessHoursStart TEXT DEFAULT '09:00',
  businessHoursEnd TEXT DEFAULT '17:00',
  businessDays TEXT DEFAULT '1,2,3,4,5',     -- comma-separated
  timezone TEXT DEFAULT 'UTC',
  enabled INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
);
```

### Added to `incidents` Table
```sql
ALTER TABLE incidents ADD COLUMN firstResponseAt TEXT;
ALTER TABLE incidents ADD COLUMN slaResponseDeadline TEXT;
ALTER TABLE incidents ADD COLUMN slaResolutionDeadline TEXT;
ALTER TABLE incidents ADD COLUMN slaResponseBreached INTEGER DEFAULT 0;
ALTER TABLE incidents ADD COLUMN slaResolutionBreached INTEGER DEFAULT 0;
```

## API Endpoints

### Team SLA Configuration
- **GET** `/api/teams/[id]/sla` - Get SLA settings for a team
- **PUT** `/api/teams/[id]/sla` - Create or update SLA settings
- **DELETE** `/api/teams/[id]/sla` - Delete SLA settings

### SLA Monitoring
- **GET** `/api/sla/check` - Check all open incidents for SLA breaches

## Components

### `TeamSLAConfig.tsx`
Modal component for configuring team SLA settings:
- Response and resolution time inputs (in hours)
- Business hours configuration
- Enable/disable toggle
- Timezone selection
- Business days selection

### `SLAIndicator.tsx`
Visual component for displaying SLA status:
- **Small mode**: Compact badges for lists
- **Large mode**: Detailed progress bars for detail views
- Color-coded status indicators
- Time remaining display

## Usage

### For Team Owners/Admins
1. Navigate to Teams page
2. Click "SLA" button on your team
3. Configure response and resolution targets for each severity
4. Optionally enable business hours mode
5. Save settings

### For Users
- SLA indicators automatically appear on incidents from teams with SLA configured
- Visual feedback shows time remaining or breach status
- Email notifications sent when SLA targets are at risk or breached

### For System Administrators
Set up a cron job to periodically check SLA compliance:
```bash
# Check SLA every 5 minutes
*/5 * * * * curl http://localhost:3000/api/sla/check
```

## Calculations

### SLA Deadline Calculation
1. Get base target time (e.g., 15 minutes for critical response)
2. If business hours only:
   - Skip non-business hours
   - Skip non-business days
   - Account for timezone
3. Return deadline timestamp

### SLA Status Calculation
1. Calculate elapsed time (respecting business hours if enabled)
2. Compare to target time
3. Determine status:
   - **Met**: Completed within target
   - **At Risk**: >80% of time elapsed, not completed
   - **Breached**: Exceeded target time
4. Calculate percentage and remaining time

## Email Notifications

### Response SLA At Risk/Breached
- **Subject**: ⚠️ SLA At Risk: [Incident Title]
- **Content**: Incident details, SLA type, time remaining
- **Action**: Link to incident

### Resolution SLA At Risk/Breached
- **Subject**: ⚠️ SLA Breached: [Incident Title]
- **Content**: Incident details, SLA type, time overdue
- **Action**: Link to incident

## Best Practices

### Recommended SLA Targets
- **Critical**: Response 15min, Resolution 4h
- **High**: Response 30min, Resolution 8h
- **Medium**: Response 1h, Resolution 24h
- **Low**: Response 4h, Resolution 48h

### Business Hours
- Enable for teams with defined on-call schedules
- Disable for 24/7 support teams
- Set timezone to match team location

### Monitoring
- Run SLA check at least every 5-15 minutes
- Monitor notification delivery
- Review SLA breach reports regularly

## Future Enhancements
- SLA compliance dashboard with metrics
- Historical SLA performance reports
- Custom escalation policies based on SLA status
- Slack/Teams integration for notifications
- SLA pause functionality for planned maintenance
- Multiple SLA tiers per severity
