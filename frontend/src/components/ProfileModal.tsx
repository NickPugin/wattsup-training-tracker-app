import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function ProfileModal({ userId, currentUserId, onClose, onProfileUpdate }: { userId: string, currentUserId: string, onClose: () => void, onProfileUpdate?: () => void }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const avatars = ['dino.png', 'lion.png', 'owl.png', 'cactus.png', 'lemon.png', 'tortoise.png', 'hare.png', 'fox.png', 'cat.png', 'rocket.png', 'frog.png', 'moose.png', 'bird.png']

    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)

    // Edit form state
    const [bikeModel, setBikeModel] = useState('')
    const [bikeNickname, setBikeNickname] = useState('')
    const [ftp, setFtp] = useState('')
    const [pictureUrl, setPictureUrl] = useState('')
    const [catchphrase, setCatchphrase] = useState('')
    const [isSaving, setIsSaving] = useState(false)

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
            // Note: we're reusing bike_type in the DB as bike_model to keep the schema simple,
            // but we'll show 'Bike Model' in the UI. 
            // Or wait, the user said add 'Bike nickname'. And change 'Bike type' to 'Bike model'.
            // Let's just use bike_type for model, and add bike_nickname!
            setBikeModel(data.bike_type || '')
            setBikeNickname(data.bike_nickname || '')
            setFtp(data.estimated_ftp?.toString() || '')
            setPictureUrl(data.picture_url || '')
            setCatchphrase(data.catchphrase || '')
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    bike_type: bikeModel,
                    bike_nickname: bikeNickname,
                    estimated_ftp: ftp ? parseInt(ftp) : null,
                    picture_url: pictureUrl,
                    catchphrase: catchphrase
                })
                .eq('id', userId)

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
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{profile.username}</h2>

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
                                        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancel</button>
                                        <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                                    {isOwner && (
                                        <button className="btn-secondary" style={{ marginTop: '16px', fontSize: '0.875rem' }} onClick={() => setIsEditing(true)}>
                                            Edit Profile Details
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className="btn-secondary" style={{ width: '100%' }} onClick={onClose}>
                            Close Window
                        </button>
                    </>
                )}

            </div>
        </div>
    )
}
