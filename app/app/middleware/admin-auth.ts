/**
 * Middleware to protect admin routes
 *
 * Checks if user is authenticated AND has is_admin flag.
 * Redirects non-admins to /curator.
 */
export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient()

  // Check verified user
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return navigateTo('/curator/login')
  }

  const userId = userData.user.id

  // Check if user is admin
  const { data: account, error } = await supabase
    .from('creator_accounts')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (error || !account?.is_admin) {
    return navigateTo('/curator')
  }
})
