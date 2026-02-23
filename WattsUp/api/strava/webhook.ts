import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Service Role for backend DB interactions
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ------------------------------------------------------------------------
    // 1. GET Request: Strava Webhook Subscription Validation
    // ------------------------------------------------------------------------
    if (req.method === 'GET') {
        // Strava sends a GET request to verify the webhook endpoint when it's first created.
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // We can set a custom verify_token in Vercel to ensure the request is actually from our registration script
        const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'STRAVA';

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('Strava Webhook Verified!');
                // We MUST respond with exactly the challenge string in a JSON object to complete registration
                return res.status(200).json({ 'hub.challenge': challenge });
            } else {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }
        return res.status(400).json({ error: 'Bad Request' });
    }

    // ------------------------------------------------------------------------
    // 2. POST Request: Strava Webhook Event Reception
    // ------------------------------------------------------------------------
    if (req.method === 'POST') {
        const payload = req.body;
        console.log('Received Strava Webhook:', JSON.stringify(payload));

        // Strava requires a 200 OK response within 2 seconds. In Vercel serverless, 
        // we usually have to process the request synchronously before returning, otherwise the function dies.
        // We will process it as fast as possible.

        try {
            await processStravaEvent(payload);
            return res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            console.error('Error processing Strava event:', error);
            // We still return 200 so Strava doesn't retry infinitely and ban our webhook
            return res.status(200).send('EVENT_FAILED_BUT_RECEIVED');
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function processStravaEvent(event: any) {
    // We only care about NEW activities being created
    if (event.object_type !== 'activity' || event.aspect_type !== 'create') {
        console.log(`Ignoring event: ${event.object_type} / ${event.aspect_type}`);
        return;
    }

    const athleteId = event.owner_id;
    const activityId = event.object_id;

    // 1. Find the user in our database using their Strava Athlete ID
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, strava_access_token, strava_refresh_token, strava_token_expires_at')
        .eq('strava_athlete_id', athleteId)
        .single();

    if (profileError || !profile) {
        console.log(`No completely matched user found for Strava Athlete ID: ${athleteId}`);
        return; // User hasn't linked their account, ignore the event 
    }

    // 2. Check if the access token is expired, refresh it if necessary
    let accessToken = profile.strava_access_token;
    const tokenExpiresAt = new Date(profile.strava_token_expires_at).getTime();

    // Add a 5 minute buffer to expiration check
    if (Date.now() >= tokenExpiresAt - (5 * 60 * 1000)) {
        console.log(`Refreshing expired Strava token for user ${profile.id}...`);
        accessToken = await refreshStravaToken(profile.id, profile.strava_refresh_token);
    }

    // 3. Fetch the full activity details from Strava
    const activityResponse = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!activityResponse.ok) {
        throw new Error(`Failed to fetch activity details from Strava. Status: ${activityResponse.status}`);
    }

    const activityData = await activityResponse.json();

    // 4. Strict Filtering Logic
    const validTypes = ['Ride', 'VirtualRide', 'EBikeRide'];

    if (!validTypes.includes(activityData.type)) {
        console.log(`Activity ${activityId} is type '${activityData.type}'. Not a ride. Ignoring.`);
        return;
    }

    if (!activityData.average_watts || activityData.average_watts <= 0) {
        console.log(`Activity ${activityId} has no power data. Ignoring.`);
        return;
    }

    if (!activityData.moving_time) {
        console.log(`Activity ${activityId} has no moving time. Ignoring.`);
        return;
    }

    // 5. Calculate WattsUp Metrics
    // moving_time is in seconds.
    const durationMinutes = Math.round(activityData.moving_time / 60);
    const averageWatts = Math.round(activityData.average_watts);
    const energyKwh = Number(((averageWatts * (activityData.moving_time / 3600)) / 1000).toFixed(2));

    const startDate = new Date(activityData.start_date || activityData.start_date_local);

    // 6. Insert into Database
    const { error: insertError } = await supabase
        .from('sessions')
        .insert({
            user_id: profile.id,
            date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
            duration_minutes: durationMinutes,
            average_watts: averageWatts,
            energy_kwh: energyKwh,
            strava_activity_id: activityId
        });

    if (insertError) {
        // If it's a unique constraint violation on strava_activity_id, we just ignore it
        if (insertError.code === '23505') {
            console.log(`Activity ${activityId} already exists in database. Duplicate ignored.`);
            return;
        }
        throw insertError;
    }

    console.log(`Successfully synced Strava activity ${activityId} for user ${profile.id}! Energy: ${energyKwh} kWh`);
}

async function refreshStravaToken(userId: string, refreshToken: string): Promise<string> {
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: process.env.VITE_STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    if (!response.ok) {
        throw new Error('Failed to refresh Strava token');
    }

    const data = await response.json();

    // Save the new tokens to the database
    const { error } = await supabase
        .from('profiles')
        .update({
            strava_access_token: data.access_token,
            strava_refresh_token: data.refresh_token,
            strava_token_expires_at: new Date(data.expires_at * 1000).toISOString()
        })
        .eq('id', userId);

    if (error) throw error;

    return data.access_token;
}
