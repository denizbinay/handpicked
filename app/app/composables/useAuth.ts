import type { Session, User } from '@supabase/supabase-js'

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const supabase = useSupabaseClient()

  const authState = useState<AuthState>('auth-state', () => 'loading')
  const session = useState<Session | null>('auth-session', () => null)
  const user = useState<User | null>('auth-user', () => null)
  const authInitialized = useState<boolean>('auth-initialized', () => false)

  function setFromSession(nextSession: Session | null) {
    session.value = nextSession
    authState.value = nextSession ? 'authenticated' : 'unauthenticated'
    if (!nextSession) {
      user.value = null
    }
  }

  async function refreshSession() {
    const { data } = await supabase.auth.getSession()
    setFromSession(data.session)
    return data.session
  }

  async function refreshUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      user.value = null
      return null
    }
    user.value = data.user ?? null
    return user.value
  }

  function initAuth() {
    if (authInitialized.value) return
    authInitialized.value = true

    if (process.server) return

    authState.value = 'loading'
    refreshSession()

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      setFromSession(nextSession)
    })
  }

  return {
    authState,
    session,
    user,
    initAuth,
    refreshSession,
    refreshUser,
  }
}
