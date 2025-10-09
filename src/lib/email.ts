import nodemailer from 'nodemailer';
import config, { logger, isFeatureEnabled } from './config';

// Email configuration from centralized config
const EMAIL_CONFIG = {
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: config.email.smtp.secure,
  auth: {
    user: config.email.smtp.user,
    pass: config.email.smtp.pass,
  },
};

const FROM_EMAIL = config.email.from.email;
const FROM_NAME = config.email.from.name;

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!isFeatureEnabled('emailNotifications')) {
    return null;
  }
  if (!transporter && EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

// Reusable email footer with branding
function getEmailFooter(): string {
  return `
    <div class="footer">
      <p style="margin: 0 0 12px 0; font-weight: 600; color: #1f2937;">Project Orion ✨ - On-Call Management</p>
      <p style="margin: 0 0 8px 0;">This is an automated notification. Please do not reply to this email.</p>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-size: 11px;">
          Built with ❤️ by <a href="https://vira.solutions" style="color: #667eea; text-decoration: none;">Ing. Johanna Rührig</a>
        </p>
        <p style="margin: 0; font-size: 11px;">
          <a href="https://github.com/TheRealVira/Project-Orion" style="color: #667eea; text-decoration: none; margin-right: 12px;">📦 Source Code</a>
          <a href="https://ko-fi.com/vira" style="color: #ff5e5b; text-decoration: none; margin-right: 12px;">☕ Support on Ko-fi</a>
          <a href="https://github.com/TheRealVira/Project-Orion/blob/main/LICENSE" style="color: #667eea; text-decoration: none;">📄 MIT License</a>
        </p>
      </div>
    </div>
  `;
}

export interface IncidentEmailData {
  incidentId: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  source: string;
  teamName?: string;
  assignedToName?: string;
  createdAt: string;
}

export async function sendIncidentCreatedEmail(
  recipientEmail: string,
  recipientName: string,
  incident: IncidentEmailData
): Promise<boolean> {
  if (!isFeatureEnabled('emailNotifications')) {
    logger.info(`📧 Email notifications disabled. Would have sent: New incident "${incident.title}" to ${recipientEmail}`);
    return false;
  }

  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email not configured. Skipping notification.');
    return false;
  }

  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
  }[incident.severity] || '⚪';

  const mailOptions = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: `${recipientName} <${recipientEmail}>`,
    subject: `${severityEmoji} New Incident: ${incident.title}`,
    text: `
Hi ${recipientName},

A new incident has been created and assigned to you:

Incident ID: ${incident.incidentId}
Title: ${incident.title}
Severity: ${incident.severity.toUpperCase()}
Status: ${incident.status}
Source: ${incident.source}
${incident.teamName ? `Team: ${incident.teamName}` : ''}
Created: ${new Date(incident.createdAt).toLocaleString()}

${incident.description ? `\nDescription:\n${incident.description}\n` : ''}

Please review and take action as needed.

View in Project Orion: ${config.appUrl}/?tab=incidents

---
Project Orion - On-Call Incident Management
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .incident-card { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${
      incident.severity === 'critical' ? '#dc2626' :
      incident.severity === 'high' ? '#ea580c' :
      incident.severity === 'medium' ? '#ca8a04' :
      '#2563eb'
    }; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #854d0e; }
    .badge-low { background: #dbeafe; color: #1e40af; }
    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
    .footer a { color: #667eea; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .detail-row { margin: 8px 0; }
    .label { font-weight: 600; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${severityEmoji} New Incident Alert</h1>
    </div>
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>A new incident has been created and assigned to you:</p>
      
      <div class="incident-card">
        <h2 style="margin-top: 0;">${incident.title}</h2>
        <div class="detail-row">
          <span class="label">Severity:</span>
          <span class="badge badge-${incident.severity}">${incident.severity.toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="label">Source:</span> ${incident.source}
        </div>
        <div class="detail-row">
          <span class="label">Incident ID:</span> <code>${incident.incidentId}</code>
        </div>
        ${incident.teamName ? `<div class="detail-row"><span class="label">Team:</span> ${incident.teamName}</div>` : ''}
        <div class="detail-row">
          <span class="label">Created:</span> ${new Date(incident.createdAt).toLocaleString()}
        </div>
        ${incident.description ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;"><strong>Description:</strong></p>
            <p style="margin: 5px 0 0 0;">${incident.description}</p>
          </div>
        ` : ''}
      </div>
      
      <a href="${config.appUrl}/?tab=incidents" class="btn">
        View in Project Orion →
      </a>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info(`✅ Email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    logger.error('❌ Failed to send email:', error);
    return false;
  }
}

export async function sendIncidentAssignedEmail(
  recipientEmail: string,
  recipientName: string,
  incident: IncidentEmailData
): Promise<boolean> {
  if (!isFeatureEnabled('emailNotifications')) {
    logger.info(`📧 Email notifications disabled. Would have sent: Incident assigned "${incident.title}" to ${recipientEmail}`);
    return false;
  }

  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email not configured. Skipping notification.');
    return false;
  }

  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
  }[incident.severity] || '⚪';

  const mailOptions = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: `${recipientName} <${recipientEmail}>`,
    subject: `${severityEmoji} Incident Assigned: ${incident.title}`,
    text: `
Hi ${recipientName},

An incident has been assigned to you:

Incident ID: ${incident.incidentId}
Title: ${incident.title}
Severity: ${incident.severity.toUpperCase()}
Status: ${incident.status}
Source: ${incident.source}

View and take action: ${config.appUrl}/?tab=incidents

---
Project Orion
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${severityEmoji} Incident Assigned</h1>
    </div>
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>An incident has been assigned to you: <strong>${incident.title}</strong></p>
      <a href="${config.appUrl}/?tab=incidents" class="btn">
        View Incident →
      </a>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info(`✅ Assignment email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    logger.error('❌ Failed to send assignment email:', error);
    return false;
  }
}

export interface CalendarAssignmentEmailData {
  assignmentId: string;
  date: string;
  teamName: string;
  notes?: string;
  assignedBy?: string;
}

export async function sendCalendarAssignmentEmail(
  recipientEmail: string,
  recipientName: string,
  assignment: CalendarAssignmentEmailData
): Promise<boolean> {
  if (!isFeatureEnabled('emailNotifications')) {
    logger.info(`📧 Email notifications disabled. Would have sent: Calendar assignment for ${assignment.date} to ${recipientEmail}`);
    return false;
  }

  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email not configured. Skipping notification.');
    return false;
  }

  const formattedDate = new Date(assignment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const mailOptions = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: `${recipientName} <${recipientEmail}>`,
    subject: `📅 On-Call Assignment: ${formattedDate} - ${assignment.teamName}`,
    text: `
Hi ${recipientName},

You have been assigned to on-call duty:

Team: ${assignment.teamName}
Date: ${formattedDate}
${assignment.notes ? `Notes: ${assignment.notes}` : ''}
${assignment.assignedBy ? `Assigned by: ${assignment.assignedBy}` : ''}

Please ensure you are available and prepared to respond to any incidents during this time.

View your schedule: ${config.appUrl}/?tab=calendar

---
Project Orion - On-Call Management
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .assignment-card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
    .detail-row { margin: 12px 0; }
    .label { font-weight: 600; color: #6b7280; display: inline-block; min-width: 100px; }
    .value { color: #1f2937; }
    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
    .footer a { color: #667eea; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .calendar-icon { font-size: 48px; text-align: center; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="calendar-icon">📅</div>
      <h1 style="margin: 10px 0 0 0; text-align: center;">On-Call Assignment</h1>
    </div>
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>You have been assigned to on-call duty:</p>
      
      <div class="assignment-card">
        <div class="detail-row">
          <span class="label">Team:</span>
          <span class="value"><strong>${assignment.teamName}</strong></span>
        </div>
        <div class="detail-row">
          <span class="label">Date:</span>
          <span class="value">${formattedDate}</span>
        </div>
        ${assignment.notes ? `
          <div class="detail-row">
            <span class="label">Notes:</span>
            <span class="value">${assignment.notes}</span>
          </div>
        ` : ''}
        ${assignment.assignedBy ? `
          <div class="detail-row">
            <span class="label">Assigned by:</span>
            <span class="value">${assignment.assignedBy}</span>
          </div>
        ` : ''}
      </div>
      
      <p style="margin-top: 20px;">Please ensure you are available and prepared to respond to any incidents during this time.</p>
      
      <a href="${config.appUrl}/?tab=calendar" class="btn">
        View Calendar →
      </a>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info(`✅ Calendar assignment email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    logger.error('❌ Failed to send calendar assignment email:', error);
    return false;
  }
}

export async function sendCalendarAssignmentUpdateEmail(
  recipientEmail: string,
  recipientName: string,
  assignment: CalendarAssignmentEmailData,
  changeType: 'updated' | 'removed'
): Promise<boolean> {
  if (!isFeatureEnabled('emailNotifications')) {
    logger.info(`📧 Email notifications disabled. Would have sent: Assignment ${changeType} for ${assignment.date} to ${recipientEmail}`);
    return false;
  }

  const transport = getTransporter();
  if (!transport) {
    logger.warn('Email not configured. Skipping notification.');
    return false;
  }

  const formattedDate = new Date(assignment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isRemoved = changeType === 'removed';
  const emoji = isRemoved ? '❌' : '🔄';
  const action = isRemoved ? 'Removed' : 'Updated';

  const mailOptions = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: `${recipientName} <${recipientEmail}>`,
    subject: `${emoji} On-Call Assignment ${action}: ${formattedDate} - ${assignment.teamName}`,
    text: `
Hi ${recipientName},

Your on-call assignment has been ${changeType}:

Team: ${assignment.teamName}
Date: ${formattedDate}
${!isRemoved && assignment.notes ? `Notes: ${assignment.notes}` : ''}
${assignment.assignedBy ? `Changed by: ${assignment.assignedBy}` : ''}

${isRemoved ? 'You are no longer scheduled for this date.' : 'Please review the updated assignment details.'}

View your schedule: ${config.appUrl}/?tab=calendar

---
Project Orion - On-Call Management
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isRemoved ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .assignment-card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${isRemoved ? '#dc2626' : '#667eea'}; }
    .detail-row { margin: 12px 0; }
    .label { font-weight: 600; color: #6b7280; display: inline-block; min-width: 100px; }
    .value { color: #1f2937; }
    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
    .footer a { color: #667eea; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .icon { font-size: 48px; text-align: center; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${emoji}</div>
      <h1 style="margin: 10px 0 0 0; text-align: center;">Assignment ${action}</h1>
    </div>
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>Your on-call assignment has been ${changeType}:</p>
      
      <div class="assignment-card">
        <div class="detail-row">
          <span class="label">Team:</span>
          <span class="value"><strong>${assignment.teamName}</strong></span>
        </div>
        <div class="detail-row">
          <span class="label">Date:</span>
          <span class="value">${formattedDate}</span>
        </div>
        ${!isRemoved && assignment.notes ? `
          <div class="detail-row">
            <span class="label">Notes:</span>
            <span class="value">${assignment.notes}</span>
          </div>
        ` : ''}
        ${assignment.assignedBy ? `
          <div class="detail-row">
            <span class="label">Changed by:</span>
            <span class="value">${assignment.assignedBy}</span>
          </div>
        ` : ''}
      </div>
      
      <p style="margin-top: 20px;">
        ${isRemoved ? 'You are no longer scheduled for this date.' : 'Please review the updated assignment details.'}
      </p>
      
      <a href="${config.appUrl}/?tab=calendar" class="btn">
        View Calendar →
      </a>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await transport.sendMail(mailOptions);
    logger.info(`✅ Assignment ${changeType} email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to send assignment ${changeType} email:`, error);
    return false;
  }
}

