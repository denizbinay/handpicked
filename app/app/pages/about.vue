<template>
  <div class="about-page">
    <div class="content-wrapper">
      <!-- Hero Section -->
      <header class="hero">
        <NuxtLink to="/" class="back-link">
          ← Back to Home
        </NuxtLink>
        <h1 class="hero-title">About</h1>
        <div class="hero-meta">
          <span class="meta-date">January 2025</span>
          <span class="meta-separator">·</span>
          <span class="meta-author">The Handpicked Team</span>
        </div>
      </header>

      <!-- Main Content -->
      <article class="content">
        <p class="lead">
          Remember when you could just turn on the TV and something was already playing? 
          No decisions, no scrolling, no algorithm trying to figure out what you want. 
          Just lean back and let it play.
        </p>

        <!-- Featured Image -->
        <div class="featured-image">
          <img src="/images/about-hero.jpg" alt="Handpicked - Curated TV for the internet" />
        </div>

        <!-- Section 1 -->
        <section class="content-section">
          <p>
            That's what we miss. YouTube, Netflix, all these platforms—they're incredible, but they've 
            become places of endless choice. Every video requires a decision. Every algorithm tries to 
            figure out what you want, then forces you in one direction or another. Sometimes you just 
            want to tune in and let someone else decide what's next.
          </p>
        </section>

        <!-- Section 2 with Pull Quote -->
        <section class="content-section">
          <p>
            But there's something deeper happening. We're drowning in content. There's so much of it, 
            and so many algorithms promising to help you find what you want. Yet to this day, a friend 
            with good taste—someone deep into a topic, or a music style, or a niche—is still the best 
            source for those hidden gems you'll never find through algorithms.
          </p>

          <blockquote class="pull-quote">
            Algorithms show you what's popular, what's engaging, what keeps you watching. 
            <span class="quote-emphasis">They don't show you the treasures.</span>
          </blockquote>
        </section>

        <!-- Section 3 with Pull Quote and Aside -->
        <section class="content-section">
          <p>
            Handpicked is built on a simple idea: in an era of unlimited content, the people who select 
            and curate become more important than ever.
          </p>

          <blockquote class="pull-quote">
            Today, it's more important to give someone a good playlist than to give them more music.
          </blockquote>

          <p>
            You don't need more YouTube videos—you need a way to find them, explore them, without being 
            put into a corner by an algorithm.
          </p>

          <aside class="sidebar-aside">
            <div class="aside-label">Curators ≠ Creators</div>
            <p>
              People who are good at finding content, judging content, assembling it into something meaningful. 
              You don't need to make videos to have great taste. You just need to know where to look.
            </p>
          </aside>
        </section>

        <!-- Section 4 -->
        <section class="content-section">
          <p>
            Handpicked brings back that feeling. Human curators assemble channels of YouTube videos 
            that play continuously, like old-school TV. When you visit, something is already playing. 
            You can change channels, but you can't control what's on—and that's the point.
          </p>
          <p>
            It's not about replacing YouTube. It's about creating a different way to experience it. 
            A way that's <span class="text-emphasis">passive</span>, <span class="text-emphasis">curated</span>, 
            and <span class="text-emphasis">shared</span>. When you're on a channel, everyone else sees 
            the same thing at the same time. It's television, but made from the internet.
          </p>
        </section>

        <!-- Section 5 -->
        <section class="content-section">
          <p>
            We built this because we wanted that feeling back. The feeling of turning something on 
            and just letting it play. No thinking, no choosing, no optimizing. Just watching.
          </p>
          <p>
            And we hope that curators—people with good taste who love finding and sharing great content—will 
            create channels that help others discover those treasures the algorithms never show you.
          </p>
        </section>
      </article>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
// No script logic needed for this static page
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-xl);
}

/* Hero Section */
.hero {
  margin-bottom: var(--space-3xl);
  padding-bottom: var(--space-2xl);
  border-bottom: 1px solid var(--color-border-subtle);
}

.back-link {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: none;
  display: inline-block;
  margin-bottom: var(--space-lg);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-accent);
}

.hero-title {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  margin-bottom: var(--space-md);
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-muted);
}

.meta-separator {
  color: var(--color-text-muted);
  opacity: 0.5;
}

.meta-date,
.meta-author {
  color: var(--color-text-tertiary);
}

/* Content */
.content {
  font-family: var(--font-sans);
  font-size: 18px;
  line-height: 1.8;
  color: var(--color-text-secondary);
}

.lead {
  font-size: 22px;
  line-height: 1.7;
  color: var(--color-text-primary);
  margin-bottom: var(--space-3xl);
  font-weight: 400;
}

/* Featured Image */
.featured-image {
  margin: var(--space-3xl) 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(15, 14, 12, 0.9);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.featured-image img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* Content Sections */
.content-section {
  margin-bottom: var(--space-3xl);
}

.content-section:last-child {
  margin-bottom: 0;
}

.content-section p {
  margin-bottom: var(--space-xl);
}

.content-section p:last-child {
  margin-bottom: 0;
}

/* Pull Quotes */
.pull-quote {
  margin: var(--space-2xl) 0;
  padding: var(--space-xl);
  border-left: 2px solid var(--color-accent);
  font-size: 20px;
  line-height: 1.6;
  color: var(--color-text-primary);
  font-style: italic;
  background: rgba(15, 14, 12, 0.85);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  box-shadow: var(--shadow-soft);
}

.quote-emphasis {
  font-style: normal;
  font-weight: 600;
  color: var(--color-accent);
}

/* Typography Hierarchy - Text Emphasis */
.text-emphasis {
  font-family: var(--font-mono);
  font-size: 16px;
  color: var(--color-text-primary);
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Sidebar Asides */
.sidebar-aside {
  margin: var(--space-2xl) 0;
  padding: var(--space-xl);
  background: rgba(15, 14, 12, 0.85);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  border-left: 3px solid var(--color-accent);
  box-shadow: var(--shadow-soft);
}

.aside-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-md);
  font-weight: 500;
}

.sidebar-aside p {
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-wrapper {
    padding: var(--space-2xl) var(--space-lg);
    max-width: 100%;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-meta {
    font-size: 12px;
  }

  .back-link {
    font-size: 12px;
  }

  .content {
    font-size: 17px;
  }

  .lead {
    font-size: 20px;
  }

  .content-section {
    margin-bottom: var(--space-2xl);
  }

  .pull-quote {
    font-size: 18px;
    padding: var(--space-lg);
  }

  .text-emphasis {
    font-size: 15px;
  }
}

@media (max-width: 640px) {
  .content-wrapper {
    padding: var(--space-xl) var(--space-md);
  }

  .hero-title {
    font-size: 32px;
  }

  .back-link {
    font-size: 11px;
  }

  .content {
    font-size: 16px;
    line-height: 1.75;
  }

  .lead {
    font-size: 18px;
  }

  .content-section {
    margin-bottom: var(--space-2xl);
  }

  .hero-meta {
    font-size: 11px;
  }

  .pull-quote {
    font-size: 17px;
    padding: var(--space-md);
    margin: var(--space-xl) 0;
  }

  .sidebar-aside {
    padding: var(--space-lg);
  }

  .text-emphasis {
    font-size: 14px;
  }
}
</style>
