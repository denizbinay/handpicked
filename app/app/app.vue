<template>
  <div class="app-shell">
    <ClientOnly>
      <PersistentPlayer />
    </ClientOnly>
    <NuxtPage />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}
</style>
