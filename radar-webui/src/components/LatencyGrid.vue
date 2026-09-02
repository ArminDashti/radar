<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { assetUrl, type GridResponse } from '@/lib/api'
import { bucketCapacity, type Interval } from '@/lib/latency'
import { useSquareSize } from '@/lib/squareSize'
import LatencySquare from './LatencySquare.vue'

const props = defineProps<{
  data: GridResponse | null
  interval: Interval
  loading?: boolean
  error?: string
  boxedRows?: boolean
}>()

const emit = defineEmits<{
  capacity: [count: number]
}>()

const gapPx = 1
const squareStartMultiplier = 5
const { squareSizePx } = useSquareSize()

const stripRef = ref<HTMLElement | null>(null)
const labelMeasureRef = ref<HTMLElement | null>(null)
const appliedSquareSizePx = ref(squareSizePx.value)
const measuredLabelPx = ref(0)
const stripOverflows = ref(false)
const lastEmittedCapacity = ref(0)

let resizeObserver: ResizeObserver | null = null

const bucketCount = computed(() => props.data?.buckets.length ?? 0)

const longestRowName = computed(() => {
  const rows = props.data?.rows ?? []
  if (!rows.length) return ''
  return rows.reduce((longest, row) => (row.name.length > longest.length ? row.name : longest), rows[0].name)
})

const squareStartGapPx = computed(() => squareStartMultiplier * appliedSquareSizePx.value)

const gridColumns = computed(() => {
  const label = Math.max(Math.ceil(measuredLabelPx.value), 0)
  return `1.25rem ${label}px ${squareStartGapPx.value}px minmax(0, 1fr)`
})

function hostHref(host: string | undefined): string {
  if (!host) return ''
  if (/^https?:\/\//i.test(host)) return host
  return `https://${host}`
}

function fitSquares(stripWidth: number) {
  const n = bucketCount.value
  const size = squareSizePx.value
  appliedSquareSizePx.value = size

  const capacity = bucketCapacity(stripWidth, size, gapPx)
  if (capacity > 0 && capacity !== lastEmittedCapacity.value) {
    lastEmittedCapacity.value = capacity
    emit('capacity', capacity)
  }

  if (n <= 0 || stripWidth <= 0) {
    stripOverflows.value = false
    return
  }

  const gaps = (n - 1) * gapPx
  stripOverflows.value = n * size + gaps > stripWidth
}

async function measureLabelWidth() {
  await nextTick()
  if (!labelMeasureRef.value) {
    measuredLabelPx.value = 0
    return
  }
  measuredLabelPx.value = labelMeasureRef.value.getBoundingClientRect().width
}

function observeStrip(el: HTMLElement | null) {
  resizeObserver?.disconnect()
  resizeObserver = null
  stripRef.value = el
  if (!el) return

  resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? el.clientWidth
    fitSquares(width)
  })
  resizeObserver.observe(el)
  fitSquares(el.clientWidth)
}

function bindFirstStrip(el: unknown) {
  const node = el instanceof HTMLElement ? el : null
  if (node === stripRef.value) return
  observeStrip(node)
}

watch(
  [() => props.data?.buckets.length, squareSizePx],
  async () => {
    await nextTick()
    if (stripRef.value) fitSquares(stripRef.value.clientWidth)
  },
)

watch(
  [() => props.data?.rows, longestRowName, squareSizePx],
  () => {
    void measureLabelWidth()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div
    class="latency-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
    :style="{ '--sq-size': `${appliedSquareSizePx}px` }"
  >
    <span
      ref="labelMeasureRef"
      class="pointer-events-none absolute left-0 top-0 -z-10 whitespace-nowrap text-sm font-medium opacity-0"
      aria-hidden="true"
    >{{ longestRowName }}</span>

    <div v-if="loading && !data" class="grid h-full place-items-center text-sm text-muted-foreground">Loading latency data…</div>
    <div v-else-if="error && !data" class="grid h-full place-items-center p-6 text-sm text-red-500">{{ error }}</div>
    <div v-else-if="!data?.rows.length" class="grid h-full place-items-center text-sm text-muted-foreground">No rows available.</div>

    <div v-else-if="boxedRows" class="flex flex-col gap-2 p-2">
      <div
        v-for="(row, rowIndex) in data.rows"
        :key="row.id"
        class="grid items-center gap-x-2 rounded-md border border-border/70 bg-card/40 px-2 py-1.5"
        :style="{ gridTemplateColumns: gridColumns }"
      >
        <div class="h-5 w-5 shrink-0">
          <img v-if="row.flag_icon" :src="assetUrl(row.flag_icon)" alt="" class="h-5 w-5 object-contain" />
        </div>
        <div class="min-w-0 truncate text-sm font-medium" :title="row.name">
          <a
            v-if="hostHref(row.host)"
            :href="hostHref(row.host)"
            target="_blank"
            rel="noopener noreferrer"
            class="block truncate text-foreground underline-offset-2 hover:underline"
          >{{ row.name }}</a>
          <span v-else class="block truncate">{{ row.name }}</span>
        </div>
        <div aria-hidden="true" />
        <div
          :ref="rowIndex === 0 ? bindFirstStrip : undefined"
          class="flex w-full min-w-0 flex-nowrap content-start justify-start"
          :class="stripOverflows ? 'overflow-x-auto' : 'overflow-x-hidden'"
          :style="{ gap: `${gapPx}px` }"
        >
          <LatencySquare
            v-for="(bucket, index) in data.buckets"
            :key="bucket"
            :cell="row.cells[index] ?? null"
            :bucket="bucket"
            :interval="interval"
          />
        </div>
      </div>
    </div>

    <div v-else class="grid items-start gap-x-2 gap-y-1 p-2" :style="{ gridTemplateColumns: gridColumns }">
      <template v-for="(row, rowIndex) in data.rows" :key="row.id">
        <div class="h-5 w-5 shrink-0 pt-0.5">
          <img v-if="row.flag_icon" :src="assetUrl(row.flag_icon)" alt="" class="h-5 w-5 object-contain" />
        </div>
        <div class="min-w-0 truncate pt-0.5 text-sm font-medium" :title="row.name">
          <a
            v-if="hostHref(row.host)"
            :href="hostHref(row.host)"
            target="_blank"
            rel="noopener noreferrer"
            class="block truncate text-foreground underline-offset-2 hover:underline"
          >{{ row.name }}</a>
          <span v-else class="block truncate">{{ row.name }}</span>
        </div>
        <div aria-hidden="true" />
        <div
          :ref="rowIndex === 0 ? bindFirstStrip : undefined"
          class="flex w-full min-w-0 flex-nowrap content-start justify-start"
          :class="stripOverflows ? 'overflow-x-auto' : 'overflow-x-hidden'"
          :style="{ gap: `${gapPx}px` }"
        >
          <LatencySquare
            v-for="(bucket, index) in data.buckets"
            :key="bucket"
            :cell="row.cells[index] ?? null"
            :bucket="bucket"
            :interval="interval"
          />
        </div>
      </template>
    </div>
  </div>
</template>
