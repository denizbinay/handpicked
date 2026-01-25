<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      <!-- Left: Logo + Tagline -->
      <div class="brand">
        <NuxtLink to="/" class="brand-link">
          <img src="/logo.svg" alt="Handpicked" class="brand-logo" />
        </NuxtLink>
        <span class="tagline">Curated TV for the internet</span>
      </div>

      <!-- Center: Links -->
      <nav class="links">
        <NuxtLink to="/about" class="link">About</NuxtLink>
        <a href="https://github.com" target="_blank" rel="noopener" class="link">GitHub</a>
        <a href="mailto:hello@example.com" class="link">Contact</a>
      </nav>

      <!-- Right: Copyright -->
      <div class="copyright">
        <span>&copy; {{ currentYear }} Handpicked</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: var(--space-xl) var(--space-xl);
  background: linear-gradient(180deg, transparent 0%, rgba(11, 10, 8, 0.8) 100%);
  border-top: 1px solid var(--color-border-subtle);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xl);
  max-width: 1200px;
  margin: 0 auto;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.brand-link {
  display: inline-block;
  text-decoration: none;
  line-height: 0;
}

.brand-logo {
  height: 40px;
  width: auto;
  opacity: 0.85;
  transition: opacity var(--transition-fast);
}

.brand-link:hover .brand-logo {
  opacity: 1;
}

.tagline {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}

.links {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
}

.link {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.link:hover {
  color: var(--color-accent);
}

.copyright {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: var(--space-lg);
  }

  .brand {
    align-items: center;
  }

  .links {
    gap: var(--space-lg);
  }
}
</style>
