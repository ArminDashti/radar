import { computed, ref } from 'vue'
import {
  clampSquareSizePx,
  defaultSquareSizePx,
  maxSquareSizePx,
  minSquareSizePx,
  squareSizeStepPx,
} from '@/lib/latency'

const STORAGE_KEY = 'radar-latency-square-size'

function readStoredSize(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return defaultSquareSizePx
    return clampSquareSizePx(Number(raw))
  } catch {
    return defaultSquareSizePx
  }
}

function writeStoredSize(value: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    /* ignore quota / private mode */
  }
}

const squareSizePx = ref(readStoredSize())

export function useSquareSize() {
  const canDecrease = computed(() => squareSizePx.value > minSquareSizePx)
  const canIncrease = computed(() => squareSizePx.value < maxSquareSizePx)

  function setSquareSize(value: number) {
    const next = clampSquareSizePx(value)
    squareSizePx.value = next
    writeStoredSize(next)
  }

  function decreaseSquareSize() {
    setSquareSize(squareSizePx.value - squareSizeStepPx)
  }

  function increaseSquareSize() {
    setSquareSize(squareSizePx.value + squareSizeStepPx)
  }

  return {
    squareSizePx,
    canDecrease,
    canIncrease,
    setSquareSize,
    decreaseSquareSize,
    increaseSquareSize,
  }
}
