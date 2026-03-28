import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body;
    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Missing userId in request body' });
    }

    // 1. Look up the user's Strava tokens
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, strava_athlete_id, strava_access_token, strava_refresh_token, strava_token_expires_at')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        return res.status(404).json({ error: 'User profile not found' });
    }

    if (!profile.strava_athlete_id) {
        return res.status(400).json({ error: 'Strava account not connected' });
    }

    // 2. Refresh token if expired
    let accessToken = profile.strava_access_token;
    const tokenExpiresAt = new Date(profile.strava_token_expires_at).getTime();
    if (Date.now() >= tokenExpiresAt - (5 * 60 * 1000)) {
        console.log(`Refreshing expired Strava token for user ${userId}...`);
        accessToken = await refreshStravaToken(userId, profile.strava_refresh_token);
    }

    // 3. Calculate the `after` timestamp — 3 months ago in epoch seconds
    const threeMonthsAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);

    // 4. Fetch up to 200 activities from Strava (2 pages of 100)
    const validTypes = ['Ride', 'VirtualRide', 'EBikeRide'];
    let syncedCount = 0;
    let skippedCount = 0;

    for (let page = 1; page <= 2; page++) {
        const url = `https://www.strava.com/api/v3/athlete/activities?after=${threeMonthsAgo}&per_page=100&page=${page}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            console.error(`Failed to fetch Strava activities page ${page}: ${response.status}`);
            break;
        }

        const activities = await response.json();
        if (!activities.length) break; // No more activities

        for (const activity of activities) {
            // Filter: must be a valid ride type
            const activityType = activity.sport_type || activity.type;
            if (!validTypes.includes(activityType)) {
                skippedCount++;
                continue;
            }

            // Filter: must have power data
            if (!activity.average_watts || activity.average_watts <= 0) {
                skippedCount++;
                continue;
            }

            // Filter: must have moving time
            if (!activity.moving_time) {
                skippedCount++;
                continue;
            }

            // Calculate WattsUp metrics
            const durationMinutes = Math.round(activity.moving_time / 60);
            const averageWatts = Math.round(activity.average_watts);
            const energyKwh = Number(((averageWatts * (activity.moving_time / 3600)) / 1000).toFixed(2));
            const startDate = new Date(activity.start_date || activity.start_date_local);

            // Insert — skip silently on duplicate strava_activity_id
            const { error: insertError } = await supabase
                .from('sessions')
                .insert({
                    user_id: profile.id,
                    date: startDate.toISOString().split('T')[0],
                    duration_minutes: durationMinutes,
                    average_watts: averageWatts,
                    energy_kwh: energyKwh,
                    strava_activity_id: activity.id
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    // Duplicate — already exists, skip
                    skippedCount++;
                } else {
                    console.error(`Failed to insert activity ${activity.id}:`, insertError);
                }
            } else {
                syncedCount++;
            }
        }
    }

    console.log(`Strava sync complete for user ${userId}: ${syncedCount} imported, ${skippedCount} skipped`);
    return res.status(200).json({ syncedCount, skippedCount });
}

async function refreshStravaToken(userId: string, refreshToken: string): Promise<string> {
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: process.env.STRAVA_CLIENT_ID || process.env.VITE_STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    if (!response.ok) throw new Error('Failed to refresh Strava token');

    const data = await response.json();

    await supabase
        .from('profiles')
        .update({
            strava_access_token: data.access_token,
            strava_refresh_token: data.refresh_token,
            strava_token_expires_at: new Date(data.expires_at * 1000).toISOString()
        })
        .eq('id', userId);

    return data.access_token;
}
