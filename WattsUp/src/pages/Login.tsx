import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Activity } from 'lucide-react'

export default function Login() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            if (isSignUp) {
                // 1. Sign up the user
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                })

                if (authError) throw authError
            } else {
                // Sign In
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Activity size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                <h1 className="text-gradient">WattsUp Training Tracker</h1>
                <p className="text-muted" style={{ marginTop: '8px' }}>Log your sessions. Track your total power. Compete on the leaderboard.</p>
            </div>

            <div className="glass-card animate-fade-in" style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>
                    {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </h2>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="rider@team.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ marginTop: '8px' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : (isSignUp ? 'Join Team' : 'Sign In')}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                        {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}
                        <button
                            type="button"
                            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
