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
  } else {
    // Update last login
    await supabase
      .from('creator_accounts')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)
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
  background: #0a0a0a;
}

.confirm-container {
  text-align: center;
  padding: 32px;
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
  border: 2px solid #333;
  border-top-color: #fff;
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
  color: #888;
  font-size: 14px;
}

.error h2 {
  color: #fff;
  font-size: 20px;
  margin-bottom: 8px;
}

.error p {
  margin-bottom: 16px;
}

.retry-link {
  color: #4af;
  text-decoration: none;
  font-size: 14px;
}

.retry-link:hover {
  text-decoration: underline;
}
</style>
