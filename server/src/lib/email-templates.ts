/**
 * HTML email templates for OBP notifications.
 * Returns { subject, html, text } for each event type.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #2563eb; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .content { padding: 32px; color: #374151; line-height: 1.6; }
    .detail-row { display: flex; gap: 12px; margin-bottom: 12px; }
    .detail-label { font-weight: 600; color: #6b7280; min-width: 120px; }
    .highlight-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>OpenBooking Protocol</h1></div>
    <div class="content">${body}</div>
    <div class="footer">Powered by OpenBooking Protocol (OBP). This is an automated message.</div>
  </div>
</body>
</html>`;
}

export function bookingConfirmationTemplate(data: {
  customerName: string;
  serviceName: string;
  providerName: string;
  startTime: Date;
  endTime: Date;
  bookingId: string;
  serverUrl: string;
}): EmailTemplate {
  const dateStr = data.startTime.toUTCString();
  const duration = Math.round((data.endTime.getTime() - data.startTime.getTime()) / 60000);

  const html = baseLayout('Booking Confirmed', `
    <h2 style="color:#1f2937;margin-top:0">Your booking is confirmed!</h2>
    <p>Hi ${data.customerName}, your appointment has been successfully booked.</p>
    <div class="highlight-box">
      <div class="detail-row"><span class="detail-label">Service:</span><span>${data.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Provider:</span><span>${data.providerName}</span></div>
      <div class="detail-row"><span class="detail-label">Date & Time:</span><span>${dateStr}</span></div>
      <div class="detail-row"><span class="detail-label">Duration:</span><span>${duration} minutes</span></div>
      <div class="detail-row"><span class="detail-label">Booking ID:</span><span>${data.bookingId}</span></div>
    </div>
    <a href="${data.serverUrl}/bookings/${data.bookingId}" class="btn">View Booking</a>
    <p style="margin-top:24px;font-size:14px;color:#6b7280">
      Need to cancel? Visit the link above or contact ${data.providerName} directly.
    </p>
  `);

  const text = `Booking Confirmed\n\nHi ${data.customerName},\n\nYour booking is confirmed:\n\nService: ${data.serviceName}\nProvider: ${data.providerName}\nDate & Time: ${dateStr}\nDuration: ${duration} minutes\nBooking ID: ${data.bookingId}\n\nView booking: ${data.serverUrl}/bookings/${data.bookingId}`;

  return {
    subject: `Booking Confirmed — ${data.serviceName} at ${data.providerName}`,
    html,
    text,
  };
}

export function bookingCancelledTemplate(data: {
  customerName: string;
  serviceName: string;
  providerName: string;
  startTime: Date;
  bookingId: string;
  reason?: string;
}): EmailTemplate {
  const dateStr = data.startTime.toUTCString();

  const html = baseLayout('Booking Cancelled', `
    <h2 style="color:#1f2937;margin-top:0">Booking Cancelled</h2>
    <p>Hi ${data.customerName}, your booking has been cancelled.</p>
    <div class="highlight-box">
      <div class="detail-row"><span class="detail-label">Service:</span><span>${data.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Provider:</span><span>${data.providerName}</span></div>
      <div class="detail-row"><span class="detail-label">Was scheduled:</span><span>${dateStr}</span></div>
      <div class="detail-row"><span class="detail-label">Booking ID:</span><span>${data.bookingId}</span></div>
      ${data.reason ? `<div class="detail-row"><span class="detail-label">Reason:</span><span>${data.reason}</span></div>` : ''}
    </div>
    <p>If you believe this is an error, please contact ${data.providerName} directly.</p>
  `);

  const text = `Booking Cancelled\n\nHi ${data.customerName},\n\nYour booking has been cancelled:\n\nService: ${data.serviceName}\nProvider: ${data.providerName}\nWas scheduled: ${dateStr}\nBooking ID: ${data.bookingId}${data.reason ? `\nReason: ${data.reason}` : ''}`;

  return {
    subject: `Booking Cancelled — ${data.serviceName} at ${data.providerName}`,
    html,
    text,
  };
}

export function bookingReminderTemplate(data: {
  customerName: string;
  serviceName: string;
  providerName: string;
  startTime: Date;
  endTime: Date;
  bookingId: string;
  serverUrl: string;
  hoursUntil: number;
}): EmailTemplate {
  const dateStr = data.startTime.toUTCString();
  const duration = Math.round((data.endTime.getTime() - data.startTime.getTime()) / 60000);

  const html = baseLayout('Appointment Reminder', `
    <h2 style="color:#1f2937;margin-top:0">Reminder: Upcoming Appointment</h2>
    <p>Hi ${data.customerName}, you have an appointment in <strong>${data.hoursUntil} hours</strong>.</p>
    <div class="highlight-box">
      <div class="detail-row"><span class="detail-label">Service:</span><span>${data.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Provider:</span><span>${data.providerName}</span></div>
      <div class="detail-row"><span class="detail-label">Date & Time:</span><span>${dateStr}</span></div>
      <div class="detail-row"><span class="detail-label">Duration:</span><span>${duration} minutes</span></div>
    </div>
    <a href="${data.serverUrl}/bookings/${data.bookingId}" class="btn">View Details</a>
  `);

  const text = `Appointment Reminder\n\nHi ${data.customerName},\n\nYou have an appointment in ${data.hoursUntil} hours:\n\nService: ${data.serviceName}\nProvider: ${data.providerName}\nDate & Time: ${dateStr}\nDuration: ${duration} minutes`;

  return {
    subject: `Reminder: ${data.serviceName} in ${data.hoursUntil}h — ${data.providerName}`,
    html,
    text,
  };
}

export function providerNewBookingTemplate(data: {
  providerName: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  startTime: Date;
  bookingId: string;
  serverUrl: string;
  notes?: string;
}): EmailTemplate {
  const dateStr = data.startTime.toUTCString();

  const html = baseLayout('New Booking Received', `
    <h2 style="color:#1f2937;margin-top:0">New Booking</h2>
    <p>A new booking has been received for <strong>${data.providerName}</strong>.</p>
    <div class="highlight-box">
      <div class="detail-row"><span class="detail-label">Customer:</span><span>${data.customerName} &lt;${data.customerEmail}&gt;</span></div>
      <div class="detail-row"><span class="detail-label">Service:</span><span>${data.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Date & Time:</span><span>${dateStr}</span></div>
      <div class="detail-row"><span class="detail-label">Booking ID:</span><span>${data.bookingId}</span></div>
      ${data.notes ? `<div class="detail-row"><span class="detail-label">Notes:</span><span>${data.notes}</span></div>` : ''}
    </div>
    <a href="${data.serverUrl}/dashboard/bookings/${data.bookingId}" class="btn">Manage Booking</a>
  `);

  const text = `New Booking\n\nCustomer: ${data.customerName} <${data.customerEmail}>\nService: ${data.serviceName}\nDate & Time: ${dateStr}\nBooking ID: ${data.bookingId}${data.notes ? `\nNotes: ${data.notes}` : ''}`;

  return {
    subject: `New Booking: ${data.customerName} — ${data.serviceName}`,
    html,
    text,
  };
}
