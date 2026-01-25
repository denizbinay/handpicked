<script setup lang="ts">
const supabase = useSupabaseClient()
const router = useRouter()

const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    // The Supabase client automatically handles the token from the URL
    const { data, error: authError } = await supabase.auth.getSession()

    if (authError) {
      error.value = authError.message
      return
    }

    if (data.session) {
      // Ensure creator account exists
      await ensureCreatorAccount(data.session.user.id, data.session.user.email!)

      // Redirect to curator dashboard
      router.push('/curator')
    } else {
      error.value = 'No session found. Please try logging in again.'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
})

async function ensureCreatorAccount(userId: string, email: string) {
  // Check if creator account exists
  const { data: existing } = await supabase
    .from('creator_accounts')
    .select('id')
    .eq('id', userId)
    .single()

  if (!existing) {
    // Create creator account
    await supabase.from('creator_accounts').insert({
      id: userId,
      email: email,
    })

    // Generate username from email (part before @, alphanumeric only)
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const displayName = email.split('@')[0]

    // Create initial creator profile
    await supabase.from('creator_profiles').insert({
      id: userId,
      username: username,
      display_name: displayName,
    })
  } else {
    // Update last login
    await supabase
      .from('creator_accounts')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)

    // Ensure profile exists (for existing users who don't have one yet)
    const { data: profileExists } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!profileExists) {
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      const displayName = email.split('@')[0]

      await supabase.from('creator_profiles').insert({
        id: userId,
        username: username,
        display_name: displayName,
      })
    }
  }
}
</script>

<template>
  <div class="confirm-page">
    <div class="confirm-container">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Confirming your login...</p>
      </div>

      <div v-else-if="error" class="error">
        <h2>Login Failed</h2>
        <p>{{ error }}</p>
        <NuxtLink to="/curator/login" class="retry-link">Try again</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.confirm-container {
  text-align: center;
  padding: 32px 28px;
  background: rgba(15, 14, 12, 0.85);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(8px);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(244, 239, 230, 0.15);
  border-top-color: var(--color-text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading p,
.error p {
  color: var(--color-text-tertiary);
  font-size: 14px;
}

.error h2 {
  color: var(--color-text-primary);
  font-size: 20px;
  font-family: var(--font-display);
  margin-bottom: 8px;
}

.error p {
  margin-bottom: 16px;
}

.retry-link {
  color: var(--color-accent);
  text-decoration: none;
  font-size: 14px;
}

.retry-link:hover {
  text-decoration: underline;
}
</style>
