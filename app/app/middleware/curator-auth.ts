/**
 * Middleware to protect curator routes
 *
 * Redirects to login if not authenticated.
 * Used on /curator/* routes (except login and confirm).
 */
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // Allow access to login and confirm pages
  if (to.path === '/curator/login' || to.path === '/curator/confirm') {
    return
  }

  // Redirect to login if not authenticated
  if (!user.value) {
    return navigateTo('/curator/login')
  }
})
