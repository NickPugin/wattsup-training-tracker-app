import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Users, Plus, KeyRound } from 'lucide-react'
import dayjs from 'dayjs'

export default function Groups({ session }: { session: Session }) {
    const [groups, setGroups] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form states
    const [joinCode, setJoinCode] = useState('')
    const [isJoining, setIsJoining] = useState(false)

    const [createName, setCreateName] = useState('')
    const [createDesc, setCreateDesc] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        fetchMyGroups()
    }, [])

    const fetchMyGroups = async () => {
        try {
            // Get all groups I am a member of via the junction table
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    group_id,
                    groups (
                        id,
                        name,
                        description,
                        invite_code,
                        owner_id,
                        created_at
                    )
                `)
                .eq('user_id', session.user.id)

            if (error) throw error
            const mappedGroups = data?.map(d => d.groups).filter(Boolean) || []
            setGroups(mappedGroups)
        } catch (error) {
            console.error('Error fetching groups:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateInviteCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase()
    }

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!createName.trim()) return
        setIsCreating(true)

        try {
            const inviteCode = generateInviteCode()

            // 1. Create the Group
            const { data: newGroup, error: groupError } = await supabase
                .from('groups')
                .insert([{
                    name: createName.trim(),
                    description: createDesc.trim() || null,
                    invite_code: inviteCode,
                    owner_id: session.user.id
                }])
                .select()
                .single()

            if (groupError) throw groupError

            // 2. Automatically add creator as a member
            const { error: memberError } = await supabase
                .from('group_members')
                .insert([{
                    group_id: newGroup.id,
                    user_id: session.user.id
                }])

            if (memberError) throw memberError

            setCreateName('')
            setCreateDesc('')
            fetchMyGroups()

        } catch (error: any) {
            alert(error.message || 'Failed to create group. Database migrations may not have been run.')
        } finally {
            setIsCreating(false)
        }
    }

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!joinCode.trim()) return
        setIsJoining(true)

        try {
            // Find group by invite code
            const { data: foundGroup, error: searchError } = await supabase
                .from('groups')
                .select('id')
                .eq('invite_code', joinCode.trim().toUpperCase())
                .single()

            if (searchError || !foundGroup) {
                throw new Error("Group not found with that invite code.")
            }

            // Insert into group members
            const { error: joinError } = await supabase
                .from('group_members')
                .insert([{
                    group_id: foundGroup.id,
                    user_id: session.user.id
                }])

            // Supabase returns duplicate key error if already joined (because of composite PK)
            if (joinError) {
                if (joinError.code === '23505') throw new Error("You are already a member of this group.")
                throw joinError
            }

            setJoinCode('')
            fetchMyGroups()

        } catch (error: any) {
            alert(error.message || 'Failed to join group')
        } finally {
            setIsJoining(false)
        }
    }

    const handleLeaveGroup = async (groupId: string) => {
        if (!window.confirm("Are you sure you want to leave this group?")) return

        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', session.user.id)

            if (error) throw error
            fetchMyGroups()
        } catch (error: any) {
            alert(error.message || 'Failed to leave group')
        }
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Teams & Groups</h1>
                <p className="text-muted">Create or join groups to filter leaderboards and rivalries.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>

                {/* Join Group Card */}
                <div className="glass-card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <KeyRound size={20} color="var(--primary)" /> Join a Group
                    </h2>
                    <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label>8-Character Invite Code</label>
                            <input
                                type="text"
                                placeholder="e.g. AB12CD34"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                maxLength={8}
                                required
                                style={{ textTransform: 'uppercase' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isJoining || joinCode.length < 8}>
                            {isJoining ? 'Joining...' : 'Join Group'}
                        </button>
                    </form>
                </div>

                {/* Create Group Card */}
                <div className="glass-card" style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} color="var(--energy)" /> Create New Group
                    </h2>
                    <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label>Group Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Weekend Warriors"
                                value={createName}
                                onChange={e => setCreateName(e.target.value)}
                                required
                                maxLength={30}
                            />
                        </div>
                        <div>
                            <label>Description (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Sunday long rides"
                                value={createDesc}
                                onChange={e => setCreateDesc(e.target.value)}
                                maxLength={100}
                            />
                        </div>
                        <button type="submit" className="btn-secondary" style={{ marginTop: '4px' }} disabled={isCreating || !createName}>
                            {isCreating ? 'Creating...' : 'Create Group'}
                        </button>
                    </form>
                </div>

            </div>

            {/* My Groups List */}
            <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={24} color="var(--primary)" /> My Groups
                </h2>

                {loading ? (
                    <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading groups...</div>
                ) : groups.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        You haven't joined any groups yet. Create or join one above!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {groups.map((group: any) => (
                            <div key={group.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{group.name}</h3>
                                    {group.description && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '8px' }}>{group.description}</p>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Invite Code:</span>
                                        <code style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', color: 'var(--energy)', fontWeight: 'bold', letterSpacing: '1px' }}>
                                            {group.invite_code}
                                        </code>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined {dayjs(group.created_at).format('MMM YYYY')}</span>
                                    <button
                                        className="btn-danger"
                                        onClick={() => handleLeaveGroup(group.id)}
                                    >
                                        Leave
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}
