<script setup lang="ts">
const supabase = useSupabaseClient()
const router = useRouter()

const email = ref('')
const isLoading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

let authSubscription: { unsubscribe: () => void } | null = null

async function redirectIfAuthenticated() {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    router.push('/curator')
  }
}

async function handleLogin() {
  if (!email.value) {
    message.value = { type: 'error', text: 'Please enter your email' }
    return
  }

  isLoading.value = true
  message.value = null

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: `${window.location.origin}/curator/confirm`,
      },
    })

    if (error) {
      message.value = { type: 'error', text: error.message }
    } else {
      message.value = {
        type: 'success',
        text: 'Check your email for the magic link!',
      }
      email.value = ''
    }
  } catch (err) {
    message.value = { type: 'error', text: 'An unexpected error occurred' }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await redirectIfAuthenticated()
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      router.push('/curator')
    }
  })
  authSubscription = data.subscription
})

onUnmounted(() => {
  authSubscription?.unsubscribe()
})
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <header class="login-header">
        <h1>Curator Login</h1>
        <p>Sign in to manage your channels</p>
      </header>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            :disabled="isLoading"
            autocomplete="email"
          />
        </div>

        <button type="submit" class="login-button" :disabled="isLoading">
          {{ isLoading ? 'Sending...' : 'Send Magic Link' }}
        </button>

        <div v-if="message" class="message" :class="message.type">
          {{ message.text }}
        </div>
      </form>

      <footer class="login-footer">
        <NuxtLink to="/" class="back-link">Back to viewing</NuxtLink>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 24px;
}

.login-container {
  width: 100%;
  max-width: 360px;
  background: rgba(15, 14, 12, 0.8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px 26px;
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(8px);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-display);
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input {
  padding: 12px 16px;
  background: rgba(11, 10, 8, 0.9);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: rgba(215, 161, 103, 0.6);
}

.form-group input::placeholder {
  color: var(--color-text-muted);
}

.login-button {
  padding: 12px 24px;
  background: linear-gradient(120deg, rgba(215, 161, 103, 0.95), rgba(111, 196, 184, 0.85));
  border: 1px solid rgba(215, 161, 103, 0.4);
  border-radius: 999px;
  color: #120f0a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: var(--shadow-glow);
}

.login-button:hover:not(:disabled) {
  opacity: 0.9;
}

.login-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  padding: 12px;
  border-radius: 10px;
  font-size: 13px;
  text-align: center;
}

.message.success {
  background: rgba(0, 200, 100, 0.1);
  color: #7fd1a1;
  border: 1px solid rgba(0, 200, 100, 0.2);
}

.message.error {
  background: rgba(255, 80, 80, 0.1);
  color: #ef8a7a;
  border: 1px solid rgba(255, 80, 80, 0.2);
}

.login-footer {
  margin-top: 32px;
  text-align: center;
}

.back-link {
  color: var(--color-text-muted);
  font-size: 13px;
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-text-secondary);
}
</style>
