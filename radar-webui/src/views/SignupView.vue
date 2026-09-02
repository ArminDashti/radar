<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UserPlus } from '@lucide/vue'
import { signup } from '@/lib/api'
import { setSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const result = await signup(username.value, password.value)
    setSession(result.token, result.role, result.username)
    await router.push('/hosts')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Signup failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid flex-1 place-items-center p-4">
    <Card class="w-full max-w-sm p-6">
      <h1 class="text-2xl font-semibold">Create a Radar account</h1>
      <p class="mt-1 text-sm text-muted-foreground">Username 3–32 characters; password at least 8.</p>
      <form class="mt-6 grid gap-4" @submit.prevent="submit">
        <label class="grid gap-1.5 text-sm font-medium">Username<input v-model="username" required autocomplete="username" minlength="3" maxlength="32" pattern="[A-Za-z0-9_]+" /></label>
        <label class="grid gap-1.5 text-sm font-medium">Password<input v-model="password" required type="password" autocomplete="new-password" minlength="8" /></label>
        <p v-if="error" role="alert" class="text-sm text-red-500">{{ error }}</p>
        <Button type="submit" :disabled="loading">
          <UserPlus v-if="!loading" class="h-4 w-4" aria-hidden="true" />
          {{ loading ? 'Creating…' : 'Create account' }}
        </Button>
      </form>
      <p class="mt-4 text-sm text-muted-foreground">
        Already have an account?
        <RouterLink class="text-primary underline-offset-2 hover:underline" to="/login">Sign in</RouterLink>
      </p>
    </Card>
  </div>
</template>
