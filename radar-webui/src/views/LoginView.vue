<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogIn } from '@lucide/vue'
import { login } from '@/lib/api'
import { setSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const route = useRoute()
const router = useRouter()

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const result = await login(username.value, password.value)
    setSession(result.token, result.role, result.username)
    await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/hosts')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid flex-1 place-items-center p-4">
    <Card class="w-full max-w-sm p-6">
      <h1 class="text-2xl font-semibold">Sign in to Radar</h1>
      <p class="mt-1 text-sm text-muted-foreground">Use your monitoring account to continue.</p>
      <form class="mt-6 grid gap-4" @submit.prevent="submit">
        <label class="grid gap-1.5 text-sm font-medium">Username<input v-model="username" required autocomplete="username" /></label>
        <label class="grid gap-1.5 text-sm font-medium">Password<input v-model="password" required type="password" autocomplete="current-password" /></label>
        <p v-if="error" role="alert" class="text-sm text-red-500">{{ error }}</p>
        <Button type="submit" :disabled="loading">
          <LogIn v-if="!loading" class="h-4 w-4" aria-hidden="true" />
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </Button>
      </form>
      <p class="mt-4 text-sm text-muted-foreground">
        No account?
        <RouterLink class="text-primary underline-offset-2 hover:underline" to="/signup">Create one</RouterLink>
      </p>
    </Card>
  </div>
</template>
