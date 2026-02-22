import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { LayoutDashboard, ListIcon, LogOut, Zap, User } from 'lucide-react'
import ProfileModal from './ProfileModal'

export default function Layout({ session }: { session: Session }) {
    const navigate = useNavigate()
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <>
            <nav style={{
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border)',
                padding: '12px var(--spacing-md)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>

                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.25rem' }}>
                        <Zap size={24} color="var(--energy)" />
                        <span style={{ display: 'none' }} className="sm-show">CycleTeam</span>
                    </div>

                    {/* Navigation Links */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <NavLink
                            to="/"
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                backgroundColor: isActive ? 'var(--bg-overlay)' : 'transparent',
                                fontWeight: isActive ? 600 : 500,
                                transition: 'all 0.2s'
                            })}
                        >
                            <LayoutDashboard size={18} />
                            <span className="hide-mobile">Dashboard</span>
                        </NavLink>

                        <NavLink
                            to="/sessions"
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                backgroundColor: isActive ? 'var(--bg-overlay)' : 'transparent',
                                fontWeight: isActive ? 600 : 500,
                                transition: 'all 0.2s'
                            })}
                        >
                            <ListIcon size={18} />
                            <span className="hide-mobile">Sessions</span>
                        </NavLink>
                    </div>

                    {/* Global Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Profile Button */}
                        <button onClick={() => setIsProfileOpen(true)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.875rem' }}>
                            <User size={16} />
                            <span className="hide-mobile">Profile</span>
                        </button>

                        {/* Logout Button */}
                        <button onClick={handleSignOut} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.875rem' }}>
                            <LogOut size={16} />
                            <span className="hide-mobile">Logout</span>
                        </button>
                    </div>

                </div>
            </nav>

            {/* Main Page Content */}
            <main className="animate-fade-in" style={{ flex: 1 }}>
                <Outlet />
            </main>

            {/* Mobile utility style */}
            <style>{`
        @media (max-width: 600px) {
          .hide-mobile { display: none; }
          .sm-show { display: block; }
        }
        @media (min-width: 601px) {
          .sm-show { display: block !important; }
        }
      `}</style>

            {/* Global Profile Modal Overlay */}
            {isProfileOpen && (
                <ProfileModal
                    userId={session.user.id}
                    currentUserId={session.user.id}
                    onClose={() => setIsProfileOpen(false)}
                />
            )}
        </>
    )
}
