/**
 * Middleware to protect curator routes
 *
 * Redirects to login if not authenticated.
 * Used on /curator/* routes (except login and confirm).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const supabase = useSupabaseClient()

  // Allow access to login and confirm pages
  if (to.path === '/curator/login' || to.path === '/curator/confirm') {
    return
  }

  // Redirect to login if not authenticated (verified)
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return navigateTo('/curator/login')
  }
})
