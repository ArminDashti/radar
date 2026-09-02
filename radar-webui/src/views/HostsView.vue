<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FilterBar from '@/components/FilterBar.vue'
import LatencyGrid from '@/components/LatencyGrid.vue'
import { api, getHostPrefs, putHostPrefs, type GridResponse, type Probe } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import type { Interval, Protocol } from '@/lib/latency'

const interval = ref<Interval>('minutes')
const protocol = ref<Protocol>('http')
const probes = ref<Probe[]>([])
const selectedProbes = ref<string[]>([])
const selectedHosts = ref<string[]>([])
const hostsInitialized = ref(false)
const prefsLoaded = ref(false)
const savedHostIds = ref<string[] | null>(null)
const seenHostIds = ref(new Set<string>())
const data = ref<GridResponse | null>(null)
const bucketWindow = ref(0)
const loading = ref(false)
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined
let prefsTimer: ReturnType<typeof setTimeout> | undefined
let skipNextPrefsSave = false
let loadGeneration = 0

const hostOptions = computed(() =>
  (data.value?.rows ?? [])
    .map((row) => ({ value: String(row.id), label: row.name }))
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
)
const visibleData = computed<GridResponse | null>(() => {
  if (!data.value) return null
  const selected = new Set(selectedHosts.value)
  return { ...data.value, rows: data.value.rows.filter((row) => selected.has(String(row.id))) }
})

function probeQuery() {
  if (!probes.value.length) return 'all'
  if (selectedProbes.value.length === 0) return ''
  if (selectedProbes.value.length === probes.value.length) return 'all'
  return selectedProbes.value.join(',')
}

async function loadPrefs() {
  if (!isAuthenticated.value) {
    prefsLoaded.value = true
    savedHostIds.value = null
    return
  }
  try {
    const prefs = await getHostPrefs()
    savedHostIds.value = prefs.host_ids.map(String)
  } catch {
    savedHostIds.value = null
  } finally {
    prefsLoaded.value = true
  }
}

function schedulePrefsSave() {
  if (!isAuthenticated.value || !prefsLoaded.value || skipNextPrefsSave) return
  clearTimeout(prefsTimer)
  prefsTimer = setTimeout(() => {
    void putHostPrefs(selectedHosts.value.map(Number).filter((id) => Number.isFinite(id) && id > 0)).catch(() => {})
  }, 400)
}

function gridUrl() {
  const params = new URLSearchParams({
    interval: interval.value,
    protocol: protocol.value,
    probe: probeQuery(),
  })
  if (bucketWindow.value > 0) params.set('window', String(bucketWindow.value))
  return `/api/grid/hosts?${params}`
}

async function load() {
  const generation = ++loadGeneration
  loading.value = true
  error.value = ''
  try {
    const next = await api<GridResponse>(gridUrl())
    if (generation !== loadGeneration) return
    data.value = next
    const ids = next.rows.map((row) => String(row.id))
    const idSet = new Set(ids)
    if (!hostsInitialized.value) {
      skipNextPrefsSave = true
      if (isAuthenticated.value && savedHostIds.value && savedHostIds.value.length > 0) {
        const preferred = savedHostIds.value.filter((id) => idSet.has(id))
        selectedHosts.value = preferred.length > 0 ? preferred : ids
      } else {
        selectedHosts.value = ids
      }
      seenHostIds.value = new Set(ids)
      hostsInitialized.value = true
      skipNextPrefsSave = false
    } else {
      const kept = selectedHosts.value.filter((id) => idSet.has(id))
      const added = ids.filter((id) => !seenHostIds.value.has(id))
      skipNextPrefsSave = true
      selectedHosts.value = [...kept, ...added]
      seenHostIds.value = new Set(ids)
      skipNextPrefsSave = false
    }
  } catch (reason) {
    if (generation !== loadGeneration) return
    error.value = reason instanceof Error ? reason.message : 'Could not load host grid'
  } finally {
    if (generation === loadGeneration) loading.value = false
  }
}

function onCapacity(count: number) {
  if (count <= 0 || count === bucketWindow.value) return
  bucketWindow.value = count
  void load()
}

watch([interval, protocol, selectedProbes], load)
watch(selectedHosts, schedulePrefsSave, { deep: true })
watch(isAuthenticated, async () => {
  hostsInitialized.value = false
  prefsLoaded.value = false
  await loadPrefs()
  await load()
})

onMounted(async () => {
  probes.value = await api<Probe[]>('/api/probes').catch(() => [])
  await loadPrefs()
  selectedProbes.value = probes.value.map((probe) => probe.code)
  if (!selectedProbes.value.length) await load()
  timer = setInterval(load, 10_000)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(prefsTimer)
})
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col">
    <FilterBar
      v-model:interval="interval"
      v-model:protocol="protocol"
      v-model:selected-probes="selectedProbes"
      v-model:selected-hosts="selectedHosts"
      :probes="probes"
      :host-options="hostOptions"
      show-probe
      show-hosts
    />
    <div v-if="error && data" class="border-b bg-red-500/10 px-4 py-2 text-sm text-red-500">{{ error }}</div>
    <LatencyGrid
      :data="visibleData"
      :interval="interval"
      :loading="loading"
      :error="error"
      boxed-rows
      @capacity="onCapacity"
    />
  </section>
</template>
