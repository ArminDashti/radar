<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown } from '@lucide/vue'

export interface MultiOption { value: string; label: string }

const props = defineProps<{ modelValue: string[]; options: MultiOption[]; label: string; placeholder: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

const summary = computed(() => {
  if (!props.options.length || props.modelValue.length === 0) return props.placeholder
  if (props.modelValue.length === props.options.length) return `All ${props.placeholder}`
  if (props.modelValue.length === 1) return props.options.find((option) => option.value === props.modelValue[0])?.label ?? props.placeholder
  return `${props.modelValue.length} ${props.placeholder}`
})

function toggle(value: string) {
  const selected = new Set(props.modelValue)
  if (selected.has(value)) selected.delete(value)
  else selected.add(value)
  emit('update:modelValue', [...selected])
}

function onDocumentMouseDown(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

function onDocumentKey(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDown)
  document.addEventListener('keydown', onDocumentKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown)
  document.removeEventListener('keydown', onDocumentKey)
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="inline-flex h-9 min-w-36 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm"
      :aria-label="label"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="truncate">{{ summary }}</span>
      <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
    <div v-if="open" class="absolute z-40 mt-1 max-h-64 min-w-full overflow-auto rounded-md border bg-card p-2 shadow-md">
      <label v-for="option in options" :key="option.value" class="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent">
        <input type="checkbox" :checked="modelValue.includes(option.value)" @change="toggle(option.value)" />
        <span>{{ option.label }}</span>
      </label>
      <p v-if="!options.length" class="px-1 py-1 text-xs text-muted-foreground">No options</p>
    </div>
  </div>
</template>
