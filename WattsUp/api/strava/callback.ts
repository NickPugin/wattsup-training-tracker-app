import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase. We must use the Service Role Key here because this is a 
// server-to-server webhook callback, and we don't have the user's active session token.
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, state, error } = req.query;

    if (error) {
        console.error('Strava OAuth Error:', error);
        return res.redirect('/dashboard?strava_error=access_denied');
    }

    if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
    }

    try {
        // 1. Exchange the authorization code for access/refresh tokens
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.VITE_STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code'
            })
        });

        if (!tokenResponse.ok) {
            const errData = await tokenResponse.json();
            throw new Error(`Strava Token Exchange Failed: ${JSON.stringify(errData)}`);
        }

        const data = await tokenResponse.json();

        // data contains: 
        // access_token, refresh_token, expires_at (epoch seconds), athlete object

        // 2. We need a way to link this to the correct Supabase User.
        // During the OAuth redirect in ProfileModal, we should ideally pass the Supabase user ID 
        // in the `state` parameter so we can retrieve it here. Let's assume we update ProfileModal
        // to pass `state=${userId}`.

        const userId = state;
        if (!userId || typeof userId !== 'string') {
            throw new Error('Missing user ID in state parameter to link the account.');
        }

        // 3. Save the tokens to the profiles table
        const { error: dbError } = await supabase
            .from('profiles')
            .update({
                strava_athlete_id: data.athlete.id,
                strava_access_token: data.access_token,
                strava_refresh_token: data.refresh_token,
                // Strava returns expires_at in epoch *seconds*. PostgreSQL to_timestamp needs seconds.
                strava_token_expires_at: new Date(data.expires_at * 1000).toISOString(),
            })
            .eq('id', userId);

        if (dbError) throw dbError;

        // 4. Redirect the user back to the application Dashboard on success
        res.redirect('/dashboard?strava_sync=success');

    } catch (err: any) {
        console.error('Strava Callback Handler Error:', err);
        res.redirect('/dashboard?strava_error=' + encodeURIComponent(err.message));
    }
}
