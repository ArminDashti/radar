<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const variants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50', {
  variants: {
    variant: { default: 'bg-primary text-primary-foreground hover:bg-primary/90', secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80', outline: 'border border-input bg-background hover:bg-accent', ghost: 'hover:bg-accent' },
    size: { default: 'h-9 px-4 py-2', sm: 'h-8 px-3 text-xs', lg: 'h-10 px-8', icon: 'h-8 w-8 p-0' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})
type Variants = VariantProps<typeof variants>
const props = withDefaults(defineProps<{ variant?: Variants['variant']; size?: Variants['size']; class?: string; disabled?: boolean; type?: 'button' | 'submit' | 'reset' }>(), { variant: 'default', size: 'default', class: '', disabled: false, type: 'button' })
const classes = computed(() => cn(variants({ variant: props.variant, size: props.size }), props.class))
</script>

<template><button :class="classes" :disabled="disabled" :type="type"><slot /></button></template>
