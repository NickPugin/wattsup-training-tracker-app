import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Trophy, TrendingUp, Clock, Zap } from 'lucide-react'

import ProfileModal from '../components/ProfileModal'

export default function Dashboard({ session }: { session: Session }) {
    const [loading, setLoading] = useState(true)
    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<string | null>(null)

    // Filtering State
    const [groups, setGroups] = useState<any[]>([])
    const [selectedGroup, setSelectedGroup] = useState<string>('global')

    useEffect(() => {
        fetchMyGroups()
    }, [])

    useEffect(() => {
        fetchLeaderboard()
    }, [selectedGroup])

    const fetchMyGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('group_members')
                .select(`group_id, groups (id, name)`)
                .eq('user_id', session.user.id)

            if (error) throw error
            const mappedGroups = data?.map(d => d.groups).filter(Boolean) || []
            setGroups(mappedGroups)
        } catch (error) {
            console.error('Error fetching groups:', error)
        }
    }

    const fetchLeaderboard = async () => {
        setLoading(true)
        try {
            let userIdsForFilter: string[] | null = null;

            if (selectedGroup !== 'global') {
                const { data: members, error: membersError } = await supabase
                    .from('group_members')
                    .select('user_id')
                    .eq('group_id', selectedGroup)

                if (membersError) throw membersError
                userIdsForFilter = members?.map(m => m.user_id) || []

                if (userIdsForFilter.length === 0) {
                    setLeaderboard([])
                    setLoading(false)
                    return
                }
            }

            // 1. Fetch profiles based on filter
            let profileQuery = supabase.from('profiles').select('*')
            if (selectedGroup === 'global') {
                // Show public profiles on global leaderboard
                profileQuery = profileQuery.eq('is_public', true)
            } else if (userIdsForFilter) {
                // For groups, show all members regardless of public/private status
                profileQuery = profileQuery.in('id', userIdsForFilter)
            }
            const { data: profiles, error: profileErr } = await profileQuery
            if (profileErr) throw profileErr

            if (!profiles || profiles.length === 0) {
                setLeaderboard([])
                setLoading(false)
                return
            }

            // 2. Fetch sessions specifically for these users
            const profileIds = profiles.map(p => p.id)
            const { data: sessions, error: sessionErr } = await supabase
                .from('sessions')
                .select('*')
                .in('user_id', profileIds)

            if (sessionErr) throw sessionErr

            // 3. Aggregate data
            const aggregated = profiles.map(profile => {
                const userSessions = sessions.filter(s => s.user_id === profile.id)
                const total_kwh = userSessions.reduce((sum, s) => sum + (s.kwh || 0), 0)
                const total_minutes = userSessions.reduce((sum, s) => sum + (s.minutes || 0), 0)

                return {
                    ...profile,
                    total_kwh: parseFloat(total_kwh.toFixed(2)),
                    total_hours: parseFloat((total_minutes / 60).toFixed(1)),
                    session_count: userSessions.length
                }
            })

            // 4. Sort by highest kWh
            aggregated.sort((a, b) => b.total_kwh - a.total_kwh)
            setLeaderboard(aggregated)

        } catch (error) {
            console.error('Error fetching leaderboard:', error)
        } finally {
            setLoading(false)
        }
    }

    // Find current user's stats
    const myStats = leaderboard.find(l => l.id === session.user.id) || { total_kwh: 0, total_hours: 0, session_count: 0 }
    const myRank = leaderboard.findIndex(l => l.id === session.user.id) + 1

    // Determine rank colors
    const getRankColor = (rank: number) => {
        if (rank === 1) return '#fbbf24' // Gold
        if (rank === 2) return '#cbd5e1' // Silver
        if (rank === 3) return '#b45309' // Bronze
        return 'var(--text-main)' // White/Default
    }

    const getRankBg = (rank: number) => {
        if (rank === 1) return 'rgba(251, 191, 36, 0.1)'
        if (rank === 2) return 'rgba(203, 213, 225, 0.1)'
        if (rank === 3) return 'rgba(180, 83, 9, 0.1)'
        return 'rgba(255, 255, 255, 0.05)'
    }

    const getRankBorder = (rank: number) => {
        if (rank === 1) return 'rgba(251, 191, 36, 0.2)'
        if (rank === 2) return 'rgba(203, 213, 225, 0.2)'
        if (rank === 3) return 'rgba(180, 83, 9, 0.2)'
        return 'rgba(255, 255, 255, 0.1)'
    }

    const rankColor = getRankColor(myRank)
    const rankBg = getRankBg(myRank)
    const rankBorder = getRankBorder(myRank)

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>

            {/* Top Welcome Section */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Team Dashboard</h1>
                <p className="text-muted">Welcome back. Let's see who's pushing the most power today.</p>
            </div>

            {/* Personal Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Zap size={20} color="var(--primary)" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>My Total Energy</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {myStats.total_kwh} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kWh</span>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Clock size={20} color="var(--energy)" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Time on Saddle</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {myStats.total_hours} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>hrs</span>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.25rem' }}>
                            <TrendingUp color="var(--primary)" size={20} /> Leaderboard
                        </h2>
                        <div className="select-container" style={{ width: 'auto', minWidth: '150px' }}>
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                style={{ padding: '4px 12px', fontSize: '0.875rem', backgroundColor: 'var(--bg-base)' }}
                            >
                                <option value="global">Global (Public)</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>Team: {g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: rankBg, border: `1px solid ${rankBorder}`, padding: '6px 12px', borderRadius: '20px' }}>
                        <Trophy size={16} color={rankColor} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: rankColor }}>
                            Your Rank: #{myRank > 0 ? myRank : '-'}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading standings...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Rank</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Rider</th>
                                    <th className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Total Hours</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem' }}>Total kWh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((rider, index) => (
                                    <tr
                                        key={rider.id}
                                        style={{
                                            borderTop: '1px solid var(--border)',
                                            backgroundColor: rider.id === session.user.id ? 'var(--bg-overlay)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <td style={{ padding: '16px 20px', fontWeight: 700, color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'var(--text-muted)' }}>
                                            #{index + 1}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={() => setSelectedUser(rider.id)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}
                                                    className="mobile-tight-text text-left"
                                                >
                                                    {rider.picture_url ? (
                                                        <img src={`/avatars/${rider.picture_url}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', backgroundColor: 'var(--bg-base)' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                                            {rider.username.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-gradient hover:underline">
                                                        {rider.nationality ? rider.nationality.substring(0, 2) + ' ' : ''}{rider.username}
                                                    </span>
                                                </button>
                                                {rider.id === session.user.id && <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--primary)', borderRadius: '12px', color: 'white' }}>You</span>}
                                            </div>
                                        </td>
                                        <td className="hide-mobile" style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{rider.total_hours}h</td>
                                        <td style={{ padding: '16px 20px', fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem' }}>{rider.total_kwh}</td>
                                    </tr>
                                ))}

                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No riders found. Start logging sessions!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Profile Modal Overlay */}
            {
                selectedUser && (
                    <ProfileModal
                        userId={selectedUser}
                        currentUserId={session.user.id}
                        onClose={() => setSelectedUser(null)}
                        onProfileUpdate={fetchLeaderboard}
                    />
                )
            }

        </div >
    )
}
