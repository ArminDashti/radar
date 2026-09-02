<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Save } from '@lucide/vue'
import { api, type Probe } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type EditableProbe = Probe & { dirty?: boolean }

const probes = ref<EditableProbe[]>([])
const error = ref('')
const message = ref('')
const savingProbes = ref(false)

const dirtyProbeCount = computed(() => probes.value.filter((p) => p.dirty).length)

function markProbeDirty(probe: EditableProbe) {
  probe.dirty = true
}

async function load() {
  const probeList = await api<Probe[]>('/api/probes')
  probes.value = probeList.map((p) => ({ ...p, dirty: false }))
}

async function saveDirtyProbes() {
  const dirty = probes.value.filter((p) => p.dirty)
  if (!dirty.length) return
  savingProbes.value = true
  error.value = ''
  message.value = ''
  try {
    for (const probe of dirty) {
      const name = probe.name.trim()
      if (!name) throw new Error('Probe name is required')
      const updated = await api<Probe>(`/api/probes/${probe.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      })
      Object.assign(probe, updated, { dirty: false })
    }
    message.value = `Saved ${dirty.length} probe${dirty.length === 1 ? '' : 's'}.`
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Could not save probes'
  } finally {
    savingProbes.value = false
  }
}

onMounted(() => load().catch((reason: unknown) => {
  error.value = reason instanceof Error ? reason.message : 'Could not load probes'
}))
</script>

<template>
  <Card class="overflow-auto">
    <div class="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b bg-card p-4">
      <h1 class="text-xl font-semibold">Probes</h1>
      <p class="text-sm text-muted-foreground">{{ probes.length }} configured</p>
      <Button
        class="ml-auto"
        size="sm"
        :disabled="savingProbes || dirtyProbeCount === 0"
        @click="saveDirtyProbes"
      >
        <Save class="h-4 w-4" aria-hidden="true" />
        {{ savingProbes ? 'Saving…' : dirtyProbeCount ? `Save (${dirtyProbeCount})` : 'Save' }}
      </Button>
    </div>
    <p v-if="error" role="alert" class="px-4 pt-3 text-sm text-red-500">{{ error }}</p>
    <p v-if="message" role="status" class="px-4 pt-3 text-sm text-green-500">{{ message }}</p>
    <div v-if="!probes.length" class="p-5 text-sm text-muted-foreground">No probes configured.</div>
    <table v-else class="w-full text-sm">
      <thead class="border-b bg-muted/40 text-left text-muted-foreground">
        <tr>
          <th class="px-4 py-2 font-medium">Code</th>
          <th class="px-4 py-2 font-medium">Name</th>
          <th class="px-4 py-2 font-medium">Public IP</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="probe in probes" :key="probe.id" class="border-b" :class="{ 'bg-muted/20': probe.dirty }">
          <td class="px-4 py-2 font-mono text-xs text-muted-foreground">{{ probe.code }}</td>
          <td class="px-4 py-2">
            <input v-model="probe.name" class="w-full min-w-[8rem]" @input="markProbeDirty(probe)" />
          </td>
          <td class="px-4 py-2 font-mono text-xs text-muted-foreground">
            {{ probe.public_ip || '—' }}
          </td>
        </tr>
      </tbody>
    </table>
  </Card>
</template>
