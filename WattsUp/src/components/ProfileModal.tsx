import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react'

export default function ProfileModal({ userId, currentUserId, onClose, onProfileUpdate, isOnboarding = false }: { userId: string, currentUserId: string, onClose: () => void, onProfileUpdate?: () => void, isOnboarding?: boolean }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const avatars = ['penguin.png', 'hippo.png', 'elephant.png', 'labrador.png', 'monkey.png', 'chicken.png', 'grizzly_bear.png', 'panda.png', 'shark.png', 'octopus.png', 'sloth.png', 'mouse.png', 'lizard.png', 'dino.png', 'lion.png', 'cactus.png', 'lemon.png', 'tortoise.png', 'hare.png', 'cat.png', 'rocket.png', 'frog.png', 'bird.png', 'goat.png', 'raccoon.png', 'pig.png', 'robot.png', 'dynamite.png', 'cheetah.png']

    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(isOnboarding)

    // Edit form state
    const [username, setUsername] = useState('')
    const [nationality, setNationality] = useState('')
    const [isPublic, setIsPublic] = useState(true)
    const [bikeModel, setBikeModel] = useState('')
    const [bikeNickname, setBikeNickname] = useState('')
    const [ftp, setFtp] = useState('')
    const [pictureUrl, setPictureUrl] = useState('')
    const [catchphrase, setCatchphrase] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Account settings state
    const [showAccountSettings, setShowAccountSettings] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [isEmailLoading, setIsEmailLoading] = useState(false)
    const [isPasswordResetLoading, setIsPasswordResetLoading] = useState(false)
    const [accountSettingsMessage, setAccountSettingsMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

    const isOwner = userId === currentUserId

    // Auto-scroll when editing starts
    useEffect(() => {
        if (isEditing && scrollRef.current) {
            let index = avatars.indexOf(pictureUrl)
            if (index === -1) index = 0

            setTimeout(() => {
                if (scrollRef.current) {
                    // Stride is 72px width + 12px gap = 84px
                    scrollRef.current.scrollLeft = index * 84
                }
                if (!pictureUrl) {
                    setPictureUrl(avatars[0])
                }
            }, 50)
        }
    }, [isEditing])

    const handleScroll = () => {
        if (!scrollRef.current) return
        const scrollLeft = scrollRef.current.scrollLeft
        // Stride is 72px width + 12px gap = 84px
        const index = Math.round(scrollLeft / 84)
        const validIndex = Math.min(Math.max(index, 0), avatars.length - 1)
        if (avatars[validIndex] !== pictureUrl) {
            setPictureUrl(avatars[validIndex])
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [userId])

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
            if (error) throw error
            setProfile(data)
            setUsername(data.username || '')
            setNationality(data.nationality || '')
            setIsPublic(data.is_public !== false)
            setBikeModel(data.bike_type || '')
            setBikeNickname(data.bike_nickname || '')
            setFtp(data.estimated_ftp?.toString() || '')
            setPictureUrl(data.picture_url || '')
            setCatchphrase(data.catchphrase || '')
        } catch (error: any) {
            // PGRST116 means zero rows found. If we are onboarding, this is expected!
            if (error.code === 'PGRST116' && isOnboarding) {
                // Prime an empty profile so the UI renders the edit form
                setProfile({ id: userId, is_public: true, username: '' })
            } else {
                console.error('Error fetching profile:', error)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    username: username,
                    nationality: nationality,
                    is_public: isPublic,
                    bike_type: bikeModel,
                    bike_nickname: bikeNickname,
                    estimated_ftp: ftp ? parseInt(ftp) : null,
                    picture_url: pictureUrl,
                    catchphrase: catchphrase
                })
                .select()

            if (error) throw error
            setIsEditing(false)
            fetchProfile()
            if (onProfileUpdate) onProfileUpdate()
        } catch (error: any) {
            alert(error.message || 'Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsEmailLoading(true)
        setAccountSettingsMessage(null)
        try {
            // First re-authenticate to prove identity
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.email) throw new Error("Could not find your current email address.")

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            })
            if (signInError) throw new Error("Incorrect current password. Cannot change email.")

            const { error: updateError } = await supabase.auth.updateUser({
                email: newEmail
            })
            if (updateError) throw updateError

            setAccountSettingsMessage({ type: 'success', text: 'Success! Please check both your old and new email addresses for confirmation links.' })
            setNewEmail('')
            setCurrentPassword('')
        } catch (error: any) {
            setAccountSettingsMessage({ type: 'error', text: error.message })
        } finally {
            setIsEmailLoading(false)
        }
    }

    const handleResetPassword = async () => {
        setIsPasswordResetLoading(true)
        setAccountSettingsMessage(null)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.email) throw new Error("Could not find your current email address.")

            const { error } = await supabase.auth.resetPasswordForEmail(user.email)
            if (error) throw error

            setAccountSettingsMessage({ type: 'success', text: 'Password reset email sent! Check your inbox for the secure link.' })
        } catch (error: any) {
            setAccountSettingsMessage({ type: 'error', text: error.message })
        } finally {
            setIsPasswordResetLoading(false)
        }
    }

    const handleStravaConnect = () => {
        const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID
        // In production, use window.location.origin. In local dev, use http://localhost:5173
        const redirectUri = `${window.location.origin}/api/strava/callback`
        const scope = 'activity:read_all'

        const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}&state=${userId}`
        window.location.href = stravaAuthUrl
    }

    const handleStravaSync = async () => {
        setIsSyncing(true)
        setSyncMessage(null)
        try {
            const response = await fetch('/api/strava/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Sync failed')
            setSyncMessage({
                type: 'success',
                text: data.syncedCount > 0
                    ? `Synced ${data.syncedCount} ride${data.syncedCount !== 1 ? 's' : ''}!`
                    : 'All rides already up to date.'
            })
        } catch (err: any) {
            setSyncMessage({ type: 'error', text: err.message || 'Sync failed. Please try again.' })
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>

                {loading || !profile ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading rider...</div>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            {profile.picture_url ? (
                                <img src={`/avatars/${profile.picture_url}`} alt={profile.username} style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', display: 'block', objectFit: 'cover', border: '2px solid var(--primary)', backgroundColor: 'var(--bg-base)' }} />
                            ) : (
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                                    {profile.username ? profile.username.charAt(0).toUpperCase() : '?'}
                                </div>
                            )}
                            <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{profile.username || 'New Rider'}</h2>

                            {profile.catchphrase && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic', marginBottom: '8px' }}>
                                    "{profile.catchphrase}"
                                </p>
                            )}

                            {isOwner && (
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>This is you</span>
                            )}
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label>Choose Avatar Icon</label>
                                        <div
                                            ref={scrollRef}
                                            onScroll={handleScroll}
                                            style={{
                                                display: 'flex',
                                                gap: '12px',
                                                flexWrap: 'nowrap',
                                                overflowX: 'auto',
                                                backgroundColor: 'rgba(255,255,255,0.02)',
                                                padding: '16px calc(50% - 36px)',
                                                borderRadius: '12px',
                                                WebkitOverflowScrolling: 'touch',
                                                msOverflowStyle: 'none',  // IE and Edge
                                                scrollbarWidth: 'none',  // Firefox
                                                scrollSnapType: 'x mandatory',
                                                boxSizing: 'border-box'
                                            }}
                                            className="hide-scrollbar"
                                        >
                                            {avatars.map((avatar, idx) => {
                                                const selectedIndex = avatars.indexOf(pictureUrl)
                                                // If pictureUrl is empty, default distance to 0 for index 0 to avoid everything being grey
                                                const actualSelectedIndex = selectedIndex === -1 ? 0 : selectedIndex
                                                const distance = Math.abs(idx - actualSelectedIndex)

                                                let scale = 1.15
                                                let opacity = 1
                                                let grayscale = '0%'
                                                if (distance === 1) {
                                                    scale = 0.85
                                                    opacity = 0.7
                                                    grayscale = '50%'
                                                } else if (distance >= 2) {
                                                    scale = 0.65
                                                    opacity = 0.4
                                                    grayscale = '90%'
                                                }

                                                const isSelected = selectedIndex === idx

                                                return (
                                                    <button
                                                        key={avatar}
                                                        onClick={() => {
                                                            setPictureUrl(avatar)
                                                            if (scrollRef.current) {
                                                                // Stride is 72px width + 12px gap = 84px
                                                                scrollRef.current.scrollTo({ left: idx * 84, behavior: 'smooth' })
                                                            }
                                                        }}
                                                        type="button"
                                                        style={{
                                                            scrollSnapAlign: 'center',
                                                            flexShrink: 0,
                                                            width: '72px', height: '72px',
                                                            borderRadius: '50%',
                                                            backgroundColor: 'var(--bg-base)',
                                                            border: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                                                            padding: '2px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            transform: `scale(${scale})`,
                                                            opacity: opacity,
                                                            filter: `grayscale(${grayscale})`
                                                        }}>
                                                        <img src={`/avatars/${avatar}`} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>Public Profile</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Show my stats on the global leaderboard.</div>
                                        </div>
                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', margin: 0 }}>
                                            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isPublic ? 'var(--primary)' : 'var(--border)', transition: '.3s', borderRadius: '24px' }}>
                                                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', transform: isPublic ? 'translateX(20px)' : 'translateX(0)' }}></span>
                                            </span>
                                        </label>
                                    </div>

                                    <div>
                                        <label>Username</label>
                                        <input type="text" placeholder="e.g. SprintKing" value={username} onChange={e => setUsername(e.target.value)} maxLength={15} required />
                                    </div>

                                    <div>
                                        <label>Nationality</label>
                                        <div className="select-container">
                                            <select value={nationality} onChange={e => setNationality(e.target.value)}>
                                                <option value="">None</option>
                                                <option value="🇺🇸 United States">🇺🇸 United States</option>
                                                <option value="🇬🇧 United Kingdom">🇬🇧 United Kingdom</option>
                                                <option value="🇨🇦 Canada">🇨🇦 Canada</option>
                                                <option value="🇦🇺 Australia">🇦🇺 Australia</option>
                                                <option value="🇫🇷 France">🇫🇷 France</option>
                                                <option value="🇮🇹 Italy">🇮🇹 Italy</option>
                                                <option value="🇪🇸 Spain">🇪🇸 Spain</option>
                                                <option value="🇩🇪 Germany">🇩🇪 Germany</option>
                                                <option value="🇳🇱 Netherlands">🇳🇱 Netherlands</option>
                                                <option value="🇧🇪 Belgium">🇧🇪 Belgium</option>
                                                <option value="🇨🇭 Switzerland">🇨🇭 Switzerland</option>
                                                <option value="🇨🇴 Colombia">🇨🇴 Colombia</option>
                                                <option value="🇸🇮 Slovenia">🇸🇮 Slovenia</option>
                                                <option value="🇩🇰 Denmark">🇩🇰 Denmark</option>
                                                <option value="🇳🇴 Norway">🇳🇴 Norway</option>
                                                <option value="🇿🇦 South Africa">🇿🇦 South Africa</option>
                                                <option value="🇯🇵 Japan">🇯🇵 Japan</option>
                                                <option value="🇮🇪 Ireland">🇮🇪 Ireland</option>
                                                <option value="🇳🇿 New Zealand">🇳🇿 New Zealand</option>
                                                <option value="🇵🇱 Poland">🇵🇱 Poland</option>
                                                <option value="🇵🇹 Portugal">🇵🇹 Portugal</option>
                                                <option value="🇸🇪 Sweden">🇸🇪 Sweden</option>
                                                <option value="🇦🇹 Austria">🇦🇹 Austria</option>
                                                <option value="🇨🇿 Czech Republic">🇨🇿 Czech Republic</option>
                                                <option value="🇪🇨 Ecuador">🇪🇨 Ecuador</option>
                                                <option value="🇷🇺 Russia">🇷🇺 Russia</option>
                                                <option value="🇨🇳 China">🇨🇳 China</option>
                                                <option value="🇰🇷 South Korea">🇰🇷 South Korea</option>
                                                <option value="🇧🇷 Brazil">🇧🇷 Brazil</option>
                                                <option value="🇦🇷 Argentina">🇦🇷 Argentina</option>
                                                <option value="🇲🇽 Mexico">🇲🇽 Mexico</option>
                                                <option value="🇨🇱 Chile">🇨🇱 Chile</option>
                                                <option value="🇮🇳 India">🇮🇳 India</option>
                                                <option value="🇵🇭 Philippines">🇵🇭 Philippines</option>
                                                <option value="🇹🇼 Taiwan">🇹🇼 Taiwan</option>
                                                <option value="🇲🇾 Malaysia">🇲🇾 Malaysia</option>
                                                <option value="🇸🇬 Singapore">🇸🇬 Singapore</option>
                                                <option value="🇮🇩 Indonesia">🇮🇩 Indonesia</option>
                                                <option value="🇹🇭 Thailand">🇹🇭 Thailand</option>
                                                <option value="🇻🇳 Vietnam">🇻🇳 Vietnam</option>
                                                <option value="🇦🇪 UAE">🇦🇪 UAE</option>
                                                <option value="🇸🇦 Saudi Arabia">🇸🇦 Saudi Arabia</option>
                                                <option value="🇮🇱 Israel">🇮🇱 Israel</option>
                                                <option value="🇹🇷 Turkey">🇹🇷 Turkey</option>
                                                <option value="🇬🇷 Greece">🇬🇷 Greece</option>
                                                <option value="🇭🇺 Hungary">🇭🇺 Hungary</option>
                                                <option value="🇷🇴 Romania">🇷🇴 Romania</option>
                                                <option value="🇺🇦 Ukraine">🇺🇦 Ukraine</option>
                                                <option value="🇫🇮 Finland">🇫🇮 Finland</option>
                                                <option value="🇮🇸 Iceland">🇮🇸 Iceland</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label>Fun Team Catchphrase / Motto</label>
                                        <input type="text" placeholder="e.g. Shut up legs!" value={catchphrase} onChange={e => setCatchphrase(e.target.value)} maxLength={50} />
                                    </div>
                                    <div>
                                        <label>Primary Bike Model</label>
                                        <input type="text" placeholder="e.g. Trek Emonda SL 6" value={bikeModel} onChange={e => setBikeModel(e.target.value)} />
                                    </div>
                                    <div>
                                        <label>Bike Nickname</label>
                                        <input type="text" placeholder="e.g. The Rocket" value={bikeNickname} onChange={e => setBikeNickname(e.target.value)} />
                                    </div>
                                    <div>
                                        <label>Estimated FTP (Watts)</label>
                                        <input type="number" placeholder="e.g. 250" value={ftp} onChange={e => setFtp(e.target.value)} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        {!isOnboarding && (
                                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancel</button>
                                        )}
                                        <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={isSaving || !username}>{isSaving ? 'Saving...' : 'Save Profile'}</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Profile Visibility</span>
                                        <span style={{ fontWeight: 600, color: profile.is_public !== false ? 'var(--success)' : 'var(--text-muted)' }}>
                                            {profile.is_public !== false ? 'Public' : 'Private'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Bike Model</span>
                                        <span style={{ fontWeight: 600 }}>{profile.bike_type || 'Unknown'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Bike Nickname</span>
                                        <span style={{ fontWeight: 600 }}>{profile.bike_nickname || 'Unknown'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Estimated FTP</span>
                                        <span style={{ fontWeight: 600 }}>{profile.estimated_ftp ? `${profile.estimated_ftp} W` : 'Unknown'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Nationality</span>
                                        <span style={{ fontWeight: 600 }}>{profile.nationality || 'None'}</span>
                                    </div>

                                    {/* Strava Integration Display */}
                                    {isOwner && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'rgba(252, 76, 2, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: '#fc4c02', fontWeight: 'bold' }}>Strava Sync</span>
                                                </div>
                                                {profile.strava_athlete_id ? (
                                                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                                                        Connected
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={handleStravaConnect}
                                                        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                                                    >
                                                        <img src="/strava/btn_strava_connect.svg" alt="Connect with Strava" style={{ height: '32px' }} />
                                                    </button>
                                                )}
                                            </div>
                                            {profile.strava_athlete_id && (
                                                <>
                                                    <button
                                                        onClick={handleStravaSync}
                                                        disabled={isSyncing}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(252,76,2,0.4)', backgroundColor: 'rgba(252,76,2,0.15)', color: '#fc4c02', fontWeight: 600, fontSize: '0.8125rem', cursor: isSyncing ? 'not-allowed' : 'pointer', opacity: isSyncing ? 0.7 : 1, transition: 'all 0.2s' }}
                                                    >
                                                        {isSyncing ? '⏳ Syncing...' : '🔄 Sync Last 3 Months'}
                                                    </button>
                                                    {syncMessage && (
                                                        <div style={{ fontSize: '0.8rem', textAlign: 'center', color: syncMessage.type === 'success' ? 'var(--success)' : 'var(--danger)', marginTop: '2px' }}>
                                                            {syncMessage.text}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                <img src="/strava/pwrdBy_strava_white.svg" alt="Powered by Strava" style={{ height: '16px', opacity: 0.8 }} />
                                            </div>
                                        </div>
                                    )}

                                    {isOwner && (
                                        <>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                                <button className="btn-secondary" style={{ flex: 1, fontSize: '0.875rem' }} onClick={() => { setIsEditing(true); setShowAccountSettings(false) }}>
                                                    Edit Profile Details
                                                </button>
                                                <button className="btn-secondary" style={{ flex: 1, fontSize: '0.875rem' }} onClick={() => setShowAccountSettings(!showAccountSettings)}>
                                                    {showAccountSettings ? 'Hide Settings' : 'Account Settings'}
                                                </button>
                                            </div>

                                            {showAccountSettings && (
                                                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border)', animation: 'fade-in 0.2s ease-out' }}>
                                                    <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <KeyRound size={18} /> Account Security
                                                    </h3>

                                                    {accountSettingsMessage && (
                                                        <div style={{ padding: '12px', marginBottom: '16px', borderRadius: '6px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: accountSettingsMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: accountSettingsMessage.type === 'error' ? 'var(--danger)' : 'var(--success)', border: `1px solid ${accountSettingsMessage.type === 'error' ? 'var(--danger)' : 'var(--success)'}` }}>
                                                            {accountSettingsMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                                                            <span>{accountSettingsMessage.text}</span>
                                                        </div>
                                                    )}

                                                    <form onSubmit={handleUpdateEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>Change Email Address</div>
                                                        <div>
                                                            <input type="email" placeholder="New Email Address" required value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ width: '100%', fontSize: '0.875rem', padding: '10px' }} />
                                                        </div>
                                                        <div>
                                                            <input type="password" placeholder="Current Password (Required)" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: '100%', fontSize: '0.875rem', padding: '10px' }} />
                                                        </div>
                                                        <button type="submit" className="btn-primary" disabled={isEmailLoading} style={{ fontSize: '0.875rem', padding: '8px' }}>
                                                            {isEmailLoading ? 'Updating Email...' : 'Update Email'}
                                                        </button>
                                                    </form>

                                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '8px' }}>Reset Password</div>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>We will send a secure password reset link to your current email address inbox.</p>
                                                        <button type="button" className="btn-secondary" onClick={handleResetPassword} disabled={isPasswordResetLoading} style={{ width: '100%', fontSize: '0.875rem', padding: '8px' }}>
                                                            {isPasswordResetLoading ? 'Sending link...' : 'Send Password Reset Email'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            {/* Hide the bottom close button if onboarding */}
                            {!isOnboarding && (
                                <button className="btn-secondary" style={{ width: '100%', marginTop: '16px' }} onClick={onClose}>
                                    Close Window
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
