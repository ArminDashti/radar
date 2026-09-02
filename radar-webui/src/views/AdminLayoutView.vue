<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Database } from '@lucide/vue'
import { fetchAdminStats, type AdminStats } from '@/lib/api'
import { Card } from '@/components/ui/card'

const route = useRoute()
const stats = ref<AdminStats | null>(null)
const statsError = ref('')
let timer: ReturnType<typeof setInterval> | undefined

const tabs = [
  { to: '/admin/hosts', label: 'Hosts' },
  { to: '/admin/probes', label: 'Probes' },
  { to: '/admin/requests', label: 'Requests' },
]

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatLastSample(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  })
}

async function loadStats() {
  try {
    stats.value = await fetchAdminStats()
    statsError.value = ''
  } catch (reason) {
    statsError.value = reason instanceof Error ? reason.message : 'Could not load DB stats'
  }
}

onMounted(() => {
  void loadStats()
  timer = setInterval(() => void loadStats(), 30_000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
    <Card class="p-4">
      <div class="mb-3 flex items-center gap-2">
        <Database class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 class="text-sm font-semibold">Database</h2>
        <span
          v-if="stats"
          class="rounded-full px-2 py-0.5 text-xs"
          :class="stats.db_ok ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/15 text-red-500'"
        >{{ stats.db_ok ? 'Connected' : 'Down' }}</span>
      </div>
      <p v-if="statsError" role="alert" class="text-sm text-red-500">{{ statsError }}</p>
      <div v-else-if="!stats" class="text-sm text-muted-foreground">Loading DB stats…</div>
      <dl v-else class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div>
          <dt class="text-muted-foreground">Hosts</dt>
          <dd class="font-medium">{{ stats.hosts }} <span class="text-muted-foreground">({{ stats.active_hosts }} active)</span></dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Probes</dt>
          <dd class="font-medium">{{ stats.probes }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Samples</dt>
          <dd class="font-medium">{{ stats.samples.toLocaleString() }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Last sample</dt>
          <dd class="font-medium">{{ formatLastSample(stats.last_sample_at) }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">DB size</dt>
          <dd class="font-medium">{{ formatBytes(stats.database_bytes) }}</dd>
        </div>
      </dl>
    </Card>

    <nav class="flex gap-1 border-b" aria-label="Admin sections">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="rounded-t-md px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        :class="route.path === tab.to ? 'bg-accent text-foreground font-medium' : ''"
      >{{ tab.label }}</RouterLink>
    </nav>

    <div class="flex min-h-0 flex-1 flex-col">
      <RouterView />
    </div>
  </section>
</template>
