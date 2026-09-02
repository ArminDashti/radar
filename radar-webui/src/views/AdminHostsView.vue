<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { Plus, Power, PowerOff, Save, Trash2 } from '@lucide/vue'
import {
  api,
  apiForm,
  assetUrl,
  deleteHost,
  testHost,
  type Host,
  type HostInput,
  type Probe,
} from '@/lib/api'
import { formatLatencyMs } from '@/lib/latency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type EditableHost = Host & { dirty?: boolean; logoFile?: File | null; logoPreview?: string }

const hosts = ref<EditableHost[]>([])
const probes = ref<Probe[]>([])
const error = ref('')
const message = ref('')
const saving = ref(false)
const deleting = reactive<Record<number, boolean>>({})
const dialogOpen = ref(false)
const logoFile = ref<File | null>(null)
const logoPreview = ref('')
const form = reactive<HostInput>({
  name: '',
  host: '',
  http_enabled: true,
  icmp_enabled: true,
  probe_id: null,
  active: true,
})

const dirtyCount = computed(() => hosts.value.filter((h) => h.dirty).length)
const testing = reactive<Record<number, boolean>>({})
const testSummaries = reactive<Record<number, string>>({})

function resetForm() {
  Object.assign(form, {
    name: '',
    host: '',
    http_enabled: true,
    icmp_enabled: true,
    probe_id: null,
    active: true,
  })
  logoFile.value = null
  if (logoPreview.value.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = ''
}

function openAdd() {
  error.value = ''
  message.value = ''
  resetForm()
  dialogOpen.value = true
}

function closeDialog() {
  dialogOpen.value = false
  resetForm()
}

function onLogoPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  logoFile.value = file
  if (logoPreview.value.startsWith('blob:')) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = file ? URL.createObjectURL(file) : ''
}

function onRowLogoPicked(host: EditableHost, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (host.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(host.logoPreview)
  host.logoFile = file
  host.logoPreview = file ? URL.createObjectURL(file) : ''
  host.dirty = true
}

function markDirty(host: EditableHost) {
  host.dirty = true
}

async function load() {
  const [list, probeList] = await Promise.all([
    api<Host[]>('/api/hosts'),
    api<Probe[]>('/api/probes'),
  ])
  hosts.value = list.map((h) => ({ ...h, dirty: false, logoFile: null, logoPreview: '' }))
  probes.value = probeList
}

function payloadFrom(host: EditableHost): HostInput {
  return {
    name: host.name.trim(),
    host: host.host.trim(),
    http_enabled: host.http_enabled,
    icmp_enabled: host.icmp_enabled,
    probe_id: host.probe_id == null ? null : Number(host.probe_id),
    active: host.active,
  }
}

function addPayload(): HostInput {
  return {
    name: form.name,
    host: form.host,
    http_enabled: form.http_enabled,
    icmp_enabled: form.icmp_enabled,
    probe_id: form.probe_id == null ? null : Number(form.probe_id),
    active: form.active,
  }
}

async function submitAdd() {
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    let host = await api<Host>('/api/hosts', { method: 'POST', body: JSON.stringify(addPayload()) })
    if (logoFile.value) {
      const body = new FormData()
      body.append('logo', logoFile.value)
      host = await apiForm<Host>(`/api/hosts/${host.id}/logo`, body)
    }
    message.value = 'Host added.'
    closeDialog()
    await load()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Could not save host'
  } finally {
    saving.value = false
  }
}

async function saveDirty() {
  const dirty = hosts.value.filter((h) => h.dirty)
  if (!dirty.length) return
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    for (const host of dirty) {
      if (!host.http_enabled && !host.icmp_enabled) {
        throw new Error(`${host.name || 'Host'}: enable HTTP and/or ICMP`)
      }
      if (!host.name.trim() || !host.host.trim()) {
        throw new Error('Name and host are required')
      }
      let updated = await api<Host>(`/api/hosts/${host.id}`, {
        method: 'PUT',
        body: JSON.stringify(payloadFrom(host)),
      })
      if (host.logoFile) {
        const body = new FormData()
        body.append('logo', host.logoFile)
        updated = await apiForm<Host>(`/api/hosts/${host.id}/logo`, body)
      }
      Object.assign(host, updated, { dirty: false, logoFile: null })
      if (host.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(host.logoPreview)
      host.logoPreview = ''
    }
    message.value = `Saved ${dirty.length} host${dirty.length === 1 ? '' : 's'}.`
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Could not save hosts'
  } finally {
    saving.value = false
  }
}

function toggleActive(host: EditableHost) {
  host.active = !host.active
  host.dirty = true
}

async function runTest(id: number) {
  if (testing[id]) return
  testing[id] = true
  testSummaries[id] = 'Testing…'
  try {
    const response = await testHost(id)
    testSummaries[id] = response.results
      .map((result) => {
        const label = result.protocol.toUpperCase()
        if (!result.ok) return `${label} fail`
        if (result.latency_ms == null) return `${label} ok`
        return `${label} ${formatLatencyMs(result.latency_ms)}`
      })
      .join(' · ')
  } catch (reason) {
    testSummaries[id] = reason instanceof Error ? reason.message : 'Test failed'
  } finally {
    testing[id] = false
  }
}

async function removeHost(host: EditableHost) {
  if (deleting[host.id]) return
  const ok = window.confirm(`Delete ${host.name || host.host}? This removes the host and its samples.`)
  if (!ok) return
  deleting[host.id] = true
  error.value = ''
  message.value = ''
  try {
    await deleteHost(host.id)
    message.value = `Deleted ${host.name || host.host}.`
    await load()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Could not delete host'
  } finally {
    deleting[host.id] = false
  }
}

onMounted(() => load().catch((reason: unknown) => {
  error.value = reason instanceof Error ? reason.message : 'Could not load hosts'
}))
</script>

<template>
  <Card class="min-h-0 flex-1 overflow-auto">
    <div class="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b bg-card p-4">
      <h1 class="text-xl font-semibold">Hosts</h1>
      <p class="text-sm text-muted-foreground">{{ hosts.length }} configured</p>
      <Button class="ml-auto" size="sm" variant="outline" @click="openAdd">
        <Plus class="h-4 w-4" aria-hidden="true" /> Add host
      </Button>
      <Button size="sm" :disabled="saving || dirtyCount === 0" @click="saveDirty">
        <Save class="h-4 w-4" aria-hidden="true" />
        {{ saving ? 'Saving…' : dirtyCount ? `Save (${dirtyCount})` : 'Save' }}
      </Button>
    </div>
    <p v-if="error && !dialogOpen" role="alert" class="px-4 pt-3 text-sm text-red-500">{{ error }}</p>
    <p v-if="message && !dialogOpen" role="status" class="px-4 pt-3 text-sm text-green-500">{{ message }}</p>
    <div v-if="!hosts.length" class="p-5 text-sm text-muted-foreground">No hosts configured.</div>
    <table v-else class="w-full text-sm">
      <thead class="border-b bg-muted/40 text-left text-muted-foreground">
        <tr>
          <th class="px-4 py-2 font-medium">Logo</th>
          <th class="px-4 py-2 font-medium">Name</th>
          <th class="px-4 py-2 font-medium">Host</th>
          <th class="px-4 py-2 font-medium">HTTP</th>
          <th class="px-4 py-2 font-medium">ICMP</th>
          <th class="px-4 py-2 font-medium">Enable/Disable</th>
          <th class="px-4 py-2 font-medium">Test</th>
          <th class="px-4 py-2 font-medium">Delete</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="host in hosts" :key="host.id" class="border-b" :class="{ 'bg-muted/20': host.dirty }">
          <td class="px-4 py-2">
            <div class="flex items-center gap-2">
              <img
                v-if="host.logoPreview || host.logo_icon"
                :src="host.logoPreview || assetUrl(host.logo_icon)"
                alt=""
                class="h-6 w-6 object-contain"
              />
              <span v-else class="text-muted-foreground">—</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                class="max-w-[8rem] text-xs"
                @change="onRowLogoPicked(host, $event)"
              />
            </div>
          </td>
          <td class="px-4 py-2">
            <input v-model="host.name" class="w-full min-w-[8rem]" @input="markDirty(host)" />
          </td>
          <td class="px-4 py-2">
            <input v-model="host.host" class="w-full min-w-[10rem]" @input="markDirty(host)" />
          </td>
          <td class="px-4 py-2">
            <input v-model="host.http_enabled" type="checkbox" @change="markDirty(host)" />
          </td>
          <td class="px-4 py-2">
            <input v-model="host.icmp_enabled" type="checkbox" @change="markDirty(host)" />
          </td>
          <td class="px-4 py-2">
            <Button
              variant="outline"
              size="icon"
              :title="host.active ? `Disable ${host.name}` : `Enable ${host.name}`"
              :aria-label="host.active ? `Disable ${host.name}` : `Enable ${host.name}`"
              @click="toggleActive(host)"
            >
              <Power v-if="host.active" class="h-4 w-4 text-green-500" />
              <PowerOff v-else class="h-4 w-4 text-muted-foreground" />
            </Button>
          </td>
          <td class="px-4 py-2">
            <div class="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-8 px-2 text-xs"
                :disabled="testing[host.id]"
                @click="runTest(host.id)"
              >Test</Button>
              <span
                v-if="testSummaries[host.id]"
                class="text-xs text-muted-foreground"
              >{{ testSummaries[host.id] }}</span>
            </div>
          </td>
          <td class="px-4 py-2">
            <Button
              variant="outline"
              size="icon"
              :title="`Delete ${host.name}`"
              :aria-label="`Delete ${host.name}`"
              :disabled="deleting[host.id]"
              @click="removeHost(host)"
            >
              <Trash2 class="h-4 w-4 text-red-500" />
            </Button>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="dialogOpen"
      class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      @click.self="closeDialog"
    >
      <Card class="w-full max-w-md p-5">
        <h2 class="text-lg font-semibold">Add host</h2>
        <form class="mt-4 grid gap-4" @submit.prevent="submitAdd">
          <label class="grid gap-1 text-sm font-medium">Name<input v-model.trim="form.name" required /></label>
          <label class="grid gap-1 text-sm font-medium">Host<input v-model.trim="form.host" required placeholder="https://example.com or 1.1.1.1" /></label>
          <label class="grid gap-1 text-sm font-medium">Probe
            <select v-model="form.probe_id">
              <option :value="null">No assigned probe</option>
              <option v-for="probe in probes" :key="probe.id" :value="probe.id">{{ probe.code }} — {{ probe.name }}</option>
            </select>
          </label>
          <div class="grid gap-2 text-sm">
            <span class="font-medium">Logo</span>
            <div class="flex items-center gap-3">
              <img
                v-if="logoPreview"
                :src="logoPreview"
                alt=""
                class="h-10 w-10 rounded border object-contain bg-muted/30"
              />
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" @change="onLogoPicked" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <label class="flex items-center gap-2"><input v-model="form.http_enabled" type="checkbox" /> HTTP</label>
            <label class="flex items-center gap-2"><input v-model="form.icmp_enabled" type="checkbox" /> ICMP</label>
          </div>
          <p v-if="error" role="alert" class="text-sm text-red-500">{{ error }}</p>
          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" @click="closeDialog">Cancel</Button>
            <Button type="submit" :disabled="saving || (!form.http_enabled && !form.icmp_enabled)">
              {{ saving ? 'Saving…' : 'Add host' }}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  </Card>
</template>
