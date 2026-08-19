<script setup lang="ts">
import KitBlock from '../../components/kit/KitBlock.vue'
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Typography blocks</h1>
      <p class="page-sub">
        Headings use <code class="font-mono">--lm-font-display</code>; body text uses
        <code class="font-mono">--lm-font-sans</code>. Base size follows the density axis.
      </p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Scale">
      <div class="w-full flex flex-col gap-3">
        <p class="font-display text-4xl font-semibold tracking-tight">Display 4xl</p>
        <p class="font-display text-3xl font-semibold tracking-tight">Display 3xl</p>
        <p class="font-display text-2xl font-semibold">Heading 2xl</p>
        <p class="text-xl font-semibold">Heading xl</p>
        <p class="text-lg font-medium">Heading lg</p>
        <p class="text-base">Body base</p>
        <p class="text-xs text-muted">Small muted</p>
        <p class="text-[0.6875rem] text-subtle uppercase tracking-wider font-semibold">Overline subtle</p>
      </div>
    </KitBlock>

    <KitBlock label="Prose">
      <article class="w-full max-w-2xl flex flex-col gap-3">
        <h2 class="text-xl font-semibold">Why one number is enough</h2>
        <p class="text-muted">
          A perceptually uniform colour space lets an entire accent ramp be expressed as a single
          hue, with lightness and chroma held constant. The practical consequence is that a new
          brand is a one-line change rather than a hand-tuned palette.
        </p>
        <blockquote class="border-l-2 border-accent pl-4 italic text-muted">
          The best design-system decision is the one that removes a category of future work.
        </blockquote>
        <ul class="flex flex-col gap-1.5 text-muted list-disc pl-5">
          <li>Contrast is preserved by construction</li>
          <li>Themes and skins stay orthogonal</li>
          <li>No rebuild is required to change either</li>
        </ul>
      </article>
    </KitBlock>

    <KitBlock label="Inline">
      <p class="w-full max-w-2xl text-muted">
        Use <code class="font-mono bg-sunken px-1.5 py-0.5 rounded-xs text-fg">--lm-accent</code> in
        components, never a primitive. Press
        <kbd class="badge badge-neutral font-mono">⌘K</kbd> to search.
        <a href="#">Read the full guide</a>, or see <strong>the token reference</strong>.
      </p>
    </KitBlock>
  </div>
</template>
