<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Check, X } from '@lucide/vue'
import { approveHostRequest, listHostRequests, rejectHostRequest, type HostRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const requests = ref<HostRequest[]>([])
const error = ref('')
const message = ref('')
const loading = ref(false)
const busyId = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    requests.value = await listHostRequests('pending')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Could not load pending requests'
  } finally {
    loading.value = false
  }
}

async function approve(id: number) {
  busyId.value = id
  error.value = ''
  message.value = ''
  try {
    await approveHostRequest(id)
    message.value = `Request #${id} approved; host is now monitored.`
    await load()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Approve failed'
  } finally {
    busyId.value = null
  }
}

async function reject(id: number) {
  busyId.value = id
  error.value = ''
  message.value = ''
  try {
    await rejectHostRequest(id)
    message.value = `Request #${id} rejected.`
    await load()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Reject failed'
  } finally {
    busyId.value = null
  }
}

onMounted(() => { void load() })
</script>

<template>
  <Card class="p-4">
    <h2 class="text-sm font-semibold">Pending host requests</h2>
    <p v-if="error" role="alert" class="mt-2 text-sm text-red-500">{{ error }}</p>
    <p v-if="message" class="mt-2 text-sm text-green-600 dark:text-green-400">{{ message }}</p>
    <p v-if="loading" class="mt-2 text-sm text-muted-foreground">Loading…</p>
    <p v-else-if="!requests.length" class="mt-2 text-sm text-muted-foreground">No pending requests.</p>
    <ul v-else class="mt-3 divide-y">
      <li v-for="item in requests" :key="item.id" class="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <div>
          <div class="font-medium">{{ item.name }} <span class="text-muted-foreground">({{ item.host }})</span></div>
          <div class="text-xs text-muted-foreground">
            by {{ item.username }} · HTTP {{ item.http_enabled ? 'on' : 'off' }} · ICMP {{ item.icmp_enabled ? 'on' : 'off' }}
            · {{ new Date(item.created_at).toLocaleString() }}
          </div>
        </div>
        <div class="flex gap-2">
          <Button size="sm" :disabled="busyId === item.id" @click="approve(item.id)">
            <Check class="h-4 w-4" aria-hidden="true" /> Approve
          </Button>
          <Button size="sm" variant="outline" :disabled="busyId === item.id" @click="reject(item.id)">
            <X class="h-4 w-4" aria-hidden="true" /> Reject
          </Button>
        </div>
      </li>
    </ul>
  </Card>
</template>
