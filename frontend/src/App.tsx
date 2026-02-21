import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'

import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'

function App() {
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p className="text-muted">Loading CycleTeam Tracker...</p>
            </div>
        )
    }

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={!session ? <Login /> : <Navigate to="/" />}
                />

                {/* Protected Routes */}
                <Route element={session ? <Layout session={session} /> : <Navigate to="/login" />}>
                    <Route path="/" element={<Dashboard session={session!} />} />
                    <Route path="/sessions" element={<Sessions session={session!} />} />
                </Route>
            </Routes>
        </Router>
    )
}

export default App
