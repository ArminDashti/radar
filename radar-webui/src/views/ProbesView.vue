<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FilterBar from '@/components/FilterBar.vue'
import LatencyGrid from '@/components/LatencyGrid.vue'
import { api, type GridResponse } from '@/lib/api'
import type { Interval, Protocol } from '@/lib/latency'

const interval = ref<Interval>('minutes')
const protocol = ref<Protocol>('http')
const data = ref<GridResponse | null>(null)
const bucketWindow = ref(0)
const loading = ref(false)
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined
let loadGeneration = 0

function gridUrl() {
  const params = new URLSearchParams({
    interval: interval.value,
    protocol: protocol.value,
  })
  if (bucketWindow.value > 0) params.set('window', String(bucketWindow.value))
  return `/api/grid/probes?${params}`
}

async function load() {
  const generation = ++loadGeneration
  loading.value = true
  error.value = ''
  try {
    const next = await api<GridResponse>(gridUrl())
    if (generation !== loadGeneration) return
    data.value = next
  } catch (reason) {
    if (generation !== loadGeneration) return
    error.value = reason instanceof Error ? reason.message : 'Could not load probe grid'
  } finally {
    if (generation === loadGeneration) loading.value = false
  }
}

function onCapacity(count: number) {
  if (count <= 0 || count === bucketWindow.value) return
  bucketWindow.value = count
  void load()
}

watch([interval, protocol], load)
onMounted(async () => {
  await load()
  timer = setInterval(load, 30_000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col">
    <FilterBar v-model:interval="interval" v-model:protocol="protocol" />
    <div v-if="error && data" class="border-b bg-red-500/10 px-4 py-2 text-sm text-red-500">{{ error }}</div>
    <LatencyGrid
      :data="data"
      :interval="interval"
      :loading="loading"
      :error="error"
      boxed-rows
      @capacity="onCapacity"
    />
  </section>
</template>
