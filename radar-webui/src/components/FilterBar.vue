<script setup lang="ts">
import type { Probe } from '@/lib/api'
import type { Interval, Protocol } from '@/lib/latency'
import { useSquareSize } from '@/lib/squareSize'
import { Button } from '@/components/ui/button'
import MultiSelect from './MultiSelect.vue'

defineProps<{
  interval: Interval
  protocol: Protocol
  probes?: Probe[]
  selectedProbes?: string[]
  hostOptions?: Array<{ value: string; label: string }>
  selectedHosts?: string[]
  showProbe?: boolean
  showHosts?: boolean
}>()

const emit = defineEmits<{
  'update:interval': [value: Interval]
  'update:protocol': [value: Protocol]
  'update:selectedProbes': [value: string[]]
  'update:selectedHosts': [value: string[]]
}>()

const { squareSizePx, canDecrease, canIncrease, decreaseSquareSize, increaseSquareSize } = useSquareSize()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 border-b bg-card/60 px-4 py-3">
    <MultiSelect
      v-if="showProbe"
      :model-value="selectedProbes ?? []"
      :options="(probes ?? []).map((probe) => ({ value: probe.code, label: probe.code }))"
      label="Probe"
      placeholder="Probes"
      @update:model-value="emit('update:selectedProbes', $event)"
    />
    <select aria-label="Protocol" :value="protocol" @change="emit('update:protocol', ($event.target as HTMLSelectElement).value as Protocol)">
      <option value="http">HTTP</option>
      <option value="icmp">ICMP</option>
    </select>
    <select aria-label="Interval" :value="interval" @change="emit('update:interval', ($event.target as HTMLSelectElement).value as Interval)">
      <option value="minutes">Minutes</option>
      <option value="hours">Hours</option>
      <option value="days">Days</option>
      <option value="months">Months</option>
    </select>
    <div class="flex items-center gap-1" role="group" aria-label="Square size">
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-8 w-8 px-0"
        :disabled="!canDecrease"
        aria-label="Decrease square size"
        @click="decreaseSquareSize"
      >−</Button>
      <span class="min-w-[2.5rem] text-center text-xs text-muted-foreground" aria-live="polite">{{ squareSizePx }}px</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-8 w-8 px-0"
        :disabled="!canIncrease"
        aria-label="Increase square size"
        @click="increaseSquareSize"
      >+</Button>
    </div>
    <MultiSelect
      v-if="showHosts"
      :model-value="selectedHosts ?? []"
      :options="hostOptions ?? []"
      label="Hosts"
      placeholder="Hosts"
      @update:model-value="emit('update:selectedHosts', $event)"
    />
    <div class="ml-auto flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span><i class="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />≤50</span>
      <span><i class="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />51–100</span>
      <span><i class="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-slate-50 ring-1 ring-border" />101–200</span>
      <span><i class="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-orange-500" />201–500</span>
      <span><i class="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />&gt;500 ms</span>
    </div>
  </div>
</template>
