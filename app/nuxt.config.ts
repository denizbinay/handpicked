// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase'],

  css: ['~/assets/css/variables.css'],

  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Spline+Sans:wght@400;500;600&display=swap',
        },
      ],
    },
  },

  supabase: {
    redirectOptions: {
      login: '/curator/login',
      callback: '/curator/confirm',
      exclude: ['/', '/*'], // All viewer pages are public
    },
  },

  runtimeConfig: {
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
})
