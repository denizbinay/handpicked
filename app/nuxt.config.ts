// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase'],

  css: ['~/assets/css/variables.css'],

  supabase: {
    redirectOptions: {
      login: '/curator/login',
      callback: '/curator/confirm',
      exclude: ['/', '/*'], // All viewer pages are public
    },
  },

  runtimeConfig: {
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
  },
})
