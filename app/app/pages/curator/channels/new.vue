<script setup lang="ts">
import type { ChannelCategory } from '~/types/database'

definePageMeta({
  middleware: 'curator-auth',
})

const CATEGORIES: { value: ChannelCategory; label: string }[] = [
  { value: 'tech', label: 'Tech' },
  { value: 'music', label: 'Music' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'art', label: 'Art' },
  { value: 'science', label: 'Science' },
  { value: 'news', label: 'News' },
]

const supabase = useSupabaseClient()
const router = useRouter()

const title = ref('')
const slug = ref('')
const description = ref('')
const category = ref<ChannelCategory | null>(null)
const isPublic = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Auto-generate slug from title
watch(title, (newTitle) => {
  slug.value = newTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
})

async function handleSubmit() {
  if (!title.value || !slug.value) {
    error.value = 'Title and slug are required'
    return
  }

  // Get current session to ensure we have the user ID
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id

  if (!userId) {
    error.value = 'You must be logged in'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert({
        title: title.value,
        slug: slug.value,
        description: description.value || null,
        category: category.value,
        is_public: isPublic.value,
        created_by: userId,
      })
      .select()
      .single()
    if (channelError) {
      if (channelError.code === '23505') {
        error.value = 'A channel with this slug already exists'
      } else {
        error.value = channelError.message
      }
      return
    }

    // Create timeline (start now)
    await supabase.from('channel_timelines').insert({
      channel_id: channel.id,
      start_time: new Date().toISOString(),
    })

    // Redirect to edit page to add videos
    router.push(`/curator/channels/${channel.id}`)
  } catch (err) {
    error.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="curator-page">
    <header class="header">
      <NuxtLink to="/curator" class="back-link">&larr; Back to Dashboard</NuxtLink>
    </header>

    <main class="main">
      <div class="form-container">
        <h1>Create New Channel</h1>

        <form class="channel-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="title">Title</label>
            <input
              id="title"
              v-model="title"
              type="text"
              placeholder="My Awesome Channel"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="slug">Slug (URL)</label>
            <div class="slug-input">
              <span class="slug-prefix">/</span>
              <input
                id="slug"
                v-model="slug"
                type="text"
                placeholder="my-awesome-channel"
                :disabled="isLoading"
              />
            </div>
            <span class="hint">This will be the channel's URL</span>
          </div>

          <div class="form-group">
            <label for="description">Description (optional)</label>
            <textarea
              id="description"
              v-model="description"
              placeholder="What is this channel about?"
              rows="3"
              :disabled="isLoading"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="category">Category</label>
            <select
              id="category"
              v-model="category"
              :disabled="isLoading"
            >
              <option :value="null">Select a category...</option>
              <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div class="form-group checkbox">
            <input
              id="is-public"
              v-model="isPublic"
              type="checkbox"
              :disabled="isLoading"
            />
            <label for="is-public">Make this channel public</label>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-actions">
            <NuxtLink to="/curator" class="cancel-button">Cancel</NuxtLink>
            <button type="submit" class="submit-button" :disabled="isLoading">
              {{ isLoading ? 'Creating...' : 'Create Channel' }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.curator-page {
  min-height: 100vh;
  background: #0a0a0a;
  color: #fff;
}

.header {
  padding: 16px 24px;
  border-bottom: 1px solid #222;
}

.back-link {
  color: #888;
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  color: #fff;
}

.main {
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 24px;
}

.form-container h1 {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 32px;
}

.channel-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #888;
}

.form-group.checkbox label {
  font-weight: 400;
  color: #ccc;
}

.form-group input[type='text'],
.form-group textarea {
  padding: 12px 16px;
  background: #111;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #555;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #555;
}

.form-group textarea {
  resize: vertical;
}

.form-group select {
  padding: 12px 16px;
  background: #111;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
}

.form-group select:focus {
  border-color: #555;
}

.form-group select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slug-input {
  display: flex;
  align-items: center;
  background: #111;
  border: 1px solid #333;
  border-radius: 4px;
}

.slug-prefix {
  padding-left: 16px;
  color: #666;
  font-family: ui-monospace, monospace;
}

.slug-input input {
  border: none;
  background: transparent;
  padding-left: 4px;
}

.slug-input input:focus {
  border: none;
}

.hint {
  font-size: 12px;
  color: #555;
}

.form-group input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #fff;
}

.error-message {
  padding: 12px;
  background: rgba(255, 80, 80, 0.1);
  border: 1px solid rgba(255, 80, 80, 0.2);
  border-radius: 4px;
  color: #f55;
  font-size: 13px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
}

.cancel-button {
  padding: 12px 24px;
  background: transparent;
  border: 1px solid #333;
  border-radius: 4px;
  color: #888;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
}

.cancel-button:hover {
  border-color: #555;
  color: #fff;
}

.submit-button {
  padding: 12px 24px;
  background: #fff;
  border: none;
  border-radius: 4px;
  color: #000;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.submit-button:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
