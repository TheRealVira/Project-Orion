import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'orion@example.com';
const FROM_NAME = process.env.FROM_NAME || 'Project Orion';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter && EMAIL_CONFIG.auth.user && EMAIL_CONFIG.auth.pass) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
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
  const transport = getTransporter();
  if (!transport) {
    console.warn('Email not configured. Skipping notification.');
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

View in Project Orion: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/?tab=incidents

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
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/?tab=incidents" class="btn">
        View in Project Orion →
      </a>
    </div>
    <div class="footer">
      <p>Project Orion - On-Call Incident Management</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await transport.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

export async function sendIncidentAssignedEmail(
  recipientEmail: string,
  recipientName: string,
  incident: IncidentEmailData
): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.warn('Email not configured. Skipping notification.');
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

View and take action: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/?tab=incidents

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
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/?tab=incidents" class="btn">
        View Incident →
      </a>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await transport.sendMail(mailOptions);
    console.log(`✅ Assignment email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send assignment email:', error);
    return false;
  }
}
