// Vercel Serverless Function: Send Web Push Notifications to all subscribed devices
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// VAPID Credentials (configured via environment variables in Vercel)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BFMq_L9r3iA1EBch7BAOB7VWQ22INRH3ouPzlnILQsgtAzcd_XLyIHiF4DUIDWaSvKJ4zS-WkEgobvWvJUD2iKw';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:spielleitung@freunde-der-sonne.app';

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jxipxhxwjcbvafsvtnjx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_tCz8ghzT0v4vRe9mpsKPGQ_YM05GMQm';

let vapidConfigured = false;
function configureVapid() {
  if (vapidConfigured) return true;
  if (!VAPID_PRIVATE_KEY) return false;
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
  } catch (err) {
    console.error('Failed to configure VAPID details:', err);
    return false;
  }
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-FDS-Secret, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Freunde der Sonne Push Notification API' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional Secret Protection (if configured in Vercel environment)
  const expectedSecret = process.env.NOTIFY_SECRET;
  if (expectedSecret) {
    const providedSecret = req.headers['x-fds-secret'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (providedSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized: Invalid notification secret' });
    }
  }

  const { title, body, eventId, url } = req.body || {};

  if (!title && !body) {
    return res.status(400).json({ error: 'Title or body is required' });
  }

  if (!configureVapid()) {
    console.error('Push notification failed: VAPID_PRIVATE_KEY environment variable is not configured.');
    return res.status(500).json({
      error: 'Server configuration error: VAPID_PRIVATE_KEY is missing in Vercel environment variables.'
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. Fetch all push subscriptions from Supabase
    const { data: subs, error: fetchErr } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (fetchErr) {
      console.error('Failed to fetch push subscriptions:', fetchErr);
      return res.status(500).json({ error: 'Database error', details: fetchErr.message });
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ message: 'No subscriptions found', sent: 0 });
    }

    const payload = JSON.stringify({
      title: title || 'Freunde der Sonne ☀️',
      body: body || 'Spieltag-Update!',
      url: url || '/',
      tag: `event-${eventId || Date.now()}`
    });

    let sentCount = 0;
    let failedCount = 0;
    const deadSubscriptions = [];
    const errors = [];

    // 2. Dispatch notifications
    await Promise.allSettled(
      subs.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (err) {
          failedCount++;
          const errMsg = `${err.statusCode || 'ERR'}: ${err.body || err.message}`;
          console.warn('Push send error for endpoint:', sub.endpoint, errMsg);
          errors.push(errMsg);
          // HTTP 400, 401, 403 (key mismatch/revoked) or 404, 410 (uninstalled/expired)
          if ([400, 401, 403, 404, 410].includes(err.statusCode)) {
            deadSubscriptions.push(sub.endpoint);
          }
        }
      })
    );

    // 3. Prune dead subscriptions
    if (deadSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', deadSubscriptions);
    }

    return res.status(200).json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      pruned: deadSubscriptions.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Error in notify handler:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
