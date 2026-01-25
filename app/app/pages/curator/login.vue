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
        text: 'Magic link sent. Check your inbox in ~30 seconds.',
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
        <span class="eyebrow">Curator Access</span>
        <h1>Curate your own channel</h1>
        <p>Turn a YouTube rabbit-hole into a lean-back, always-on channel.</p>
      </header>

      <div class="login-body">
        <section class="value-stack">
          <div class="value-row">
            <span class="value-mark">01</span>
            <div class="value-copy">
              <span class="value-title">Program the lineup</span>
              <span class="value-detail">Pick videos and lock the order.</span>
            </div>
          </div>
          <div class="value-row">
            <span class="value-mark">02</span>
            <div class="value-copy">
              <span class="value-title">Run a live timeline</span>
              <span class="value-detail">Your channel plays like real TV.</span>
            </div>
          </div>
          <div class="value-row">
            <span class="value-mark">03</span>
            <div class="value-copy">
              <span class="value-title">Share one link</span>
              <span class="value-detail">No feed. No algorithm. Just the channel.</span>
            </div>
          </div>
        </section>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@studio.com"
              :disabled="isLoading"
              autocomplete="email"
            />
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            {{ isLoading ? 'Sending...' : 'Send me the magic link' }}
          </button>

          <p class="trust-line">No passwords. No spam. Just a sign-in link.</p>

          <div v-if="message" class="message" :class="message.type">
            {{ message.text }}
          </div>
        </form>
      </div>

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
  max-width: 460px;
  background: rgba(12, 11, 9, 0.9);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 28px 24px 26px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.32), var(--shadow-soft);
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: left;
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.login-header h1 {
  font-size: 26px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-display);
  margin-bottom: 0;
  letter-spacing: -0.02em;
}

.login-header p {
  font-size: 14px;
  color: var(--color-text-tertiary);
  max-width: 420px;
  line-height: 1.6;
}

.login-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.value-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.value-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.value-mark {
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(215, 161, 103, 0.8);
  border: 1px solid rgba(215, 161, 103, 0.25);
  border-radius: 999px;
  padding: 2px 8px;
  min-width: 32px;
  text-align: center;
  background: rgba(215, 161, 103, 0.08);
}

.value-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.value-title {
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.value-detail {
  font-size: 12px;
  color: var(--color-text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.form-group input {
  padding: 12px 14px;
  background: rgba(8, 7, 6, 0.95);
  border: 1px solid rgba(244, 239, 230, 0.14);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  border-color: rgba(215, 161, 103, 0.6);
  box-shadow: 0 0 0 2px rgba(215, 161, 103, 0.15);
}

.form-group input::placeholder {
  color: var(--color-text-muted);
}

.login-button {
  padding: 11px 18px;
  background: linear-gradient(120deg, rgba(215, 161, 103, 0.95), rgba(111, 196, 184, 0.85));
  border: 1px solid rgba(215, 161, 103, 0.4);
  border-radius: 999px;
  color: #120f0a;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-mono);
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: var(--shadow-glow);
  width: 100%;
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

.trust-line {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: -4px;
  font-family: var(--font-mono);
  letter-spacing: 0.5px;
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

@media (max-width: 720px) {
  .login-header {
    text-align: center;
  }

  .login-header p {
    margin: 0 auto;
  }
}
</style>
