<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GridCell } from '@/lib/api'
import type { Interval } from '@/lib/latency'
import { formatBucketTime, formatLatencyMs, latencyColor } from '@/lib/latency'

const props = defineProps<{ cell: GridCell | null; bucket: string; interval: Interval }>()
const hovering = ref(false)
const tipX = ref(0)
const tipY = ref(0)

const latency = computed(() => props.cell?.ok && props.cell.latency_ms != null ? props.cell.latency_ms : null)
const timedOut = computed(() => props.cell != null && !props.cell.ok)
const tooltip = computed(() => {
  const time = formatBucketTime(props.bucket, props.interval)
  if (latency.value !== null) return `${time} · ${formatLatencyMs(latency.value)}`
  if (timedOut.value) return `${time} · timeout`
  return ''
})

function showTip(event: MouseEvent) {
  if (!tooltip.value) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  hovering.value = true
  tipX.value = rect.left + rect.width / 2
  tipY.value = rect.top
}

function hideTip() { hovering.value = false }
</script>

<template>
  <span
    class="relative block shrink-0 overflow-hidden"
    :style="{
      width: 'var(--sq-size)',
      height: 'var(--sq-size)',
      minWidth: 'var(--sq-size)',
      minHeight: 'var(--sq-size)',
      flexShrink: 0,
    }"
    :aria-label="tooltip || 'No sample'"
    @mouseenter="showTip"
    @mouseleave="hideTip"
  >
    <span
      v-if="latency !== null"
      class="block h-full w-full rounded-[2px] ring-1 ring-black/10"
      :style="{ backgroundColor: latencyColor(latency) }"
    />
    <span
      v-else-if="timedOut"
      class="grid h-full w-full place-items-center rounded-[2px] bg-white/5"
      aria-hidden="true"
    >
      <svg viewBox="0 0 12 12" width="10" height="10">
        <path
          fill="none"
          stroke="#ef4444"
          stroke-width="2"
          stroke-linecap="round"
          d="M2.5 2.5l7 7M9.5 2.5l-7 7"
        />
      </svg>
    </span>
    <span
      v-else
      class="block h-full w-full rounded-[2px] bg-white/[0.04] ring-1 ring-white/10"
      aria-hidden="true"
    />
    <Teleport to="body">
      <span
        v-if="hovering && tooltip"
        class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow"
        :style="{ left: `${tipX}px`, top: `${tipY}px` }"
      >{{ tooltip }}</span>
    </Teleport>
  </span>
</template>
