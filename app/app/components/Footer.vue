<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      <!-- Left: Wordmark + Tagline -->
      <div class="brand">
        <span class="wordmark">Handpicked</span>
        <span class="tagline">Curated TV for the internet</span>
      </div>

      <!-- Center: Links -->
      <nav class="links">
        <a href="/about" class="link">About</a>
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
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
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

.wordmark {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: -0.02em;
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
  color: var(--color-text-secondary);
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
