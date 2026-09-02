<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Plus } from '@lucide/vue'
import { createHostRequest, listHostRequests, type HostRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const requests = ref<HostRequest[]>([])
const error = ref('')
const message = ref('')
const loading = ref(false)
const submitting = ref(false)
const form = reactive({
  name: '',
  host: '',
  http_enabled: true,
  icmp_enabled: true,
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    requests.value = await listHostRequests()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Could not load requests'
  } finally {
    loading.value = false
  }
}

async function submit() {
  submitting.value = true
  error.value = ''
  message.value = ''
  try {
    await createHostRequest({
      name: form.name.trim(),
      host: form.host.trim(),
      http_enabled: form.http_enabled,
      icmp_enabled: form.icmp_enabled,
    })
    form.name = ''
    form.host = ''
    form.http_enabled = true
    form.icmp_enabled = true
    message.value = 'Request submitted for admin review.'
    await load()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Could not submit request'
  } finally {
    submitting.value = false
  }
}

onMounted(() => { void load() })
</script>

<template>
  <section class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-auto p-4">
    <Card class="p-4">
      <h1 class="text-xl font-semibold">Request a host</h1>
      <p class="mt-1 text-sm text-muted-foreground">Admins review requests before monitoring starts.</p>
      <form class="mt-4 grid gap-3" @submit.prevent="submit">
        <label class="grid gap-1.5 text-sm font-medium">Display name<input v-model="form.name" required /></label>
        <label class="grid gap-1.5 text-sm font-medium">Host / URL<input v-model="form.host" required placeholder="example.com" /></label>
        <div class="flex flex-wrap gap-4 text-sm">
          <label class="inline-flex items-center gap-2"><input v-model="form.http_enabled" type="checkbox" /> HTTP</label>
          <label class="inline-flex items-center gap-2"><input v-model="form.icmp_enabled" type="checkbox" /> ICMP</label>
        </div>
        <p v-if="error" role="alert" class="text-sm text-red-500">{{ error }}</p>
        <p v-if="message" class="text-sm text-green-600 dark:text-green-400">{{ message }}</p>
        <Button type="submit" :disabled="submitting" class="w-fit">
          <Plus class="h-4 w-4" aria-hidden="true" />
          {{ submitting ? 'Submitting…' : 'Submit request' }}
        </Button>
      </form>
    </Card>

    <Card class="p-4">
      <h2 class="text-sm font-semibold">Your requests</h2>
      <p v-if="loading" class="mt-2 text-sm text-muted-foreground">Loading…</p>
      <p v-else-if="!requests.length" class="mt-2 text-sm text-muted-foreground">No requests yet.</p>
      <ul v-else class="mt-3 divide-y">
        <li v-for="item in requests" :key="item.id" class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
          <div>
            <div class="font-medium">{{ item.name }} <span class="text-muted-foreground">({{ item.host }})</span></div>
            <div class="text-xs text-muted-foreground">{{ new Date(item.created_at).toLocaleString() }}</div>
          </div>
          <span
            class="rounded-full px-2 py-0.5 text-xs capitalize"
            :class="{
              'bg-amber-500/15 text-amber-700 dark:text-amber-400': item.status === 'pending',
              'bg-green-500/15 text-green-700 dark:text-green-400': item.status === 'approved',
              'bg-red-500/15 text-red-600': item.status === 'rejected',
            }"
          >{{ item.status }}</span>
        </li>
      </ul>
    </Card>
  </section>
</template>
