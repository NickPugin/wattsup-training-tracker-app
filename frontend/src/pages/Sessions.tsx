import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Calendar, Clock, Zap, Activity } from 'lucide-react'
import dayjs from 'dayjs'

export default function Sessions({ session }: { session: Session }) {
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Form State
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
    const [minutes, setMinutes] = useState('')
    const [watts, setWatts] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        try {
            // For now, let's fetch my sessions. Wait, requirement says "A tabular view of all training sessions (can be filtered by team or individual)". 
            // Let's just fetch all sessions and join with profiles to get the username.
            const { data, error } = await supabase
                .from('sessions')
                .select(`
          *,
          profiles ( username, picture_url )
        `)
                .order('date', { ascending: false })

            if (error) throw error
            setSessions(data || [])
        } catch (error) {
            console.error('Error fetching sessions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddSession = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const min = parseInt(minutes)
            const avgWatts = parseInt(watts)

            // Calculate kWh: (Average Wattage * (Minutes / 60)) / 1000
            const kwh = parseFloat(((avgWatts * (min / 60)) / 1000).toFixed(4))

            const { error } = await supabase.from('sessions').insert([
                {
                    user_id: session.user.id,
                    date,
                    minutes: min,
                    average_wattage: avgWatts,
                    kwh
                }
            ])

            if (error) throw error

            // Success: close modal and refresh
            setIsAddModalOpen(false)
            setMinutes('')
            setWatts('')
            fetchSessions()

        } catch (error: any) {
            alert(error.message || 'Failed to add session')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this session? This will remove kWh from your total.")) return

        try {
            const { error } = await supabase.from('sessions').delete().eq('id', id)
            if (error) throw error

            // Update local state to remove the item instantly
            setSessions(sessions.filter(s => s.id !== id))
        } catch (error: any) {
            alert(error.message || 'Failed to delete session')
        }
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Training Sessions</h1>
                    <p className="text-muted">Review the team's latest efforts.</p>
                </div>

                {/* The required Plus Icon button for adding sessions */}
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-primary"
                    style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%' }}
                    title="Add Session"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading sessions...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Date</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Rider</th>
                                    <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Time</th>
                                    <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Avg Watts</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem' }}>Energy</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s) => {
                                    const isOwner = s.user_id === session.user.id

                                    return (
                                        <tr key={s.id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px 20px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                                {dayjs(s.date).format('MMM D, YY')}
                                            </td>
                                            <td className="mobile-tight-text" style={{ padding: '16px 20px', fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {s.profiles?.picture_url ? (
                                                        <img src={`/avatars/${s.profiles.picture_url}`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)' }} />
                                                    ) : (
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                            {s.profiles?.username?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                    {s.profiles?.username || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{s.minutes}m</td>
                                            <td className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{s.average_wattage}W</td>
                                            <td style={{ padding: '16px 20px', fontWeight: 800, color: 'var(--text-main)' }}>
                                                {parseFloat(s.kwh).toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>kWh</span>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => handleDelete(s.id)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7, padding: '8px' }}
                                                        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                                                        onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                                                        title="Delete Session"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}

                                {sessions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No sessions logged yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Session Modal Overlay */}
            {isAddModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-surface)' }}>
                        <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity color="var(--primary)" /> Log Session
                        </h2>

                        <form onSubmit={handleAddSession} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label>Date</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label>Duration (Minutes)</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="e.g. 60"
                                        value={minutes}
                                        onChange={e => setMinutes(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label>Average Wattage</label>
                                <div style={{ position: 'relative' }}>
                                    <Zap size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="e.g. 250"
                                        value={watts}
                                        onChange={e => setWatts(e.target.value)}
                                        style={{ paddingLeft: '40px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Effort'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
