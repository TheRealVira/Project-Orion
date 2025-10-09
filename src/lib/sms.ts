import config, { logger, isFeatureEnabled } from './config';

// Twilio client (lazy loaded)
let twilioClient: any = null;

function getTwilioClient() {
  if (!isFeatureEnabled('smsNotifications')) {
    return null;
  }
  
  if (!twilioClient && config.sms.twilio?.accountSid && config.sms.twilio?.authToken) {
    try {
      const twilio = require('twilio');
      twilioClient = twilio(config.sms.twilio.accountSid, config.sms.twilio.authToken);
    } catch (error) {
      logger.error('Failed to initialize Twilio client:', error);
      return null;
    }
  }
  
  return twilioClient;
}

export interface SmsData {
  to: string;
  message: string;
}

/**
 * Send SMS notification for critical incident
 */
export async function sendIncidentSms(
  phoneNumber: string,
  incidentTitle: string,
  severity: string
): Promise<boolean> {
  if (!isFeatureEnabled('smsNotifications')) {
    logger.info(`📱 SMS notifications disabled. Would have sent: "${incidentTitle}" to ${phoneNumber}`);
    return false;
  }

  const client = getTwilioClient();
  if (!client || !config.sms.twilio?.fromNumber) {
    logger.warn('SMS not configured. Skipping notification.');
    return false;
  }

  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
  }[severity] || '⚪';

  const message = `${severityEmoji} CRITICAL INCIDENT\n\n${incidentTitle}\n\nCheck Project Orion: ${config.appUrl}`;

  try {
    await client.messages.create({
      body: message,
      from: config.sms.twilio.fromNumber,
      to: phoneNumber,
    });
    
    logger.info(`✅ SMS sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    logger.error('❌ Failed to send SMS:', error);
    return false;
  }
}

/**
 * Send SMS notification for on-call assignment
 */
export async function sendAssignmentSms(
  phoneNumber: string,
  teamName: string,
  date: string
): Promise<boolean> {
  if (!isFeatureEnabled('smsNotifications')) {
    logger.info(`📱 SMS notifications disabled. Would have sent: Assignment for ${date} to ${phoneNumber}`);
    return false;
  }

  const client = getTwilioClient();
  if (!client || !config.sms.twilio?.fromNumber) {
    logger.warn('SMS not configured. Skipping notification.');
    return false;
  }

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const message = `📅 On-Call Assignment\n\nTeam: ${teamName}\nDate: ${formattedDate}\n\nYou're scheduled for on-call duty. Check Project Orion for details.`;

  try {
    await client.messages.create({
      body: message,
      from: config.sms.twilio.fromNumber,
      to: phoneNumber,
    });
    
    logger.info(`✅ Assignment SMS sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    logger.error('❌ Failed to send assignment SMS:', error);
    return false;
  }
}

/**
 * Send test SMS (for testing configuration)
 */
export async function sendTestSms(phoneNumber: string): Promise<boolean> {
  if (!isFeatureEnabled('smsNotifications')) {
    logger.info(`📱 SMS notifications disabled. Cannot send test SMS.`);
    return false;
  }

  const client = getTwilioClient();
  if (!client || !config.sms.twilio?.fromNumber) {
    logger.warn('SMS not configured. Cannot send test SMS.');
    return false;
  }

  const message = `✨ Project Orion Test\n\nYour SMS notifications are working correctly!\n\nBuilt with ❤️ by Ing. Johanna Rührig`;

  try {
    await client.messages.create({
      body: message,
      from: config.sms.twilio.fromNumber,
      to: phoneNumber,
    });
    
    logger.info(`✅ Test SMS sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    logger.error('❌ Failed to send test SMS:', error);
    return false;
  }
}
