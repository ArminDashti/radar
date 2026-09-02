<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { LogIn, LogOut, Moon, PlusCircle, Radio, Server, Settings, Sun, Monitor, User } from '@lucide/vue'
import { clearToken, isAdmin, isAuthenticated } from '@/lib/auth'
import { cycleTheme, theme } from '@/lib/theme'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const navigation = [
  { to: '/hosts', label: 'Hosts', icon: Server, protected: false },
  { to: '/probes', label: 'Probes', icon: Radio, protected: true },
  { to: '/request-host', label: 'Request host', icon: PlusCircle, protected: true },
  { to: '/admin/hosts', label: 'Admin', icon: Settings, protected: true, adminOnly: true, matchPrefix: '/admin' },
  { to: '/about-me', label: 'About Me', icon: User, protected: false },
]

function isNavActive(item: { to: string; matchPrefix?: string }) {
  if (item.matchPrefix) return route.path.startsWith(item.matchPrefix)
  return route.path === item.to
}

function logout() { clearToken(); void router.push('/login') }

function showNav(item: { protected?: boolean; adminOnly?: boolean }) {
  if (item.adminOnly) return isAdmin.value
  if (item.protected) return isAuthenticated.value
  return true
}
</script>

<template>
  <div class="flex h-dvh min-h-0 flex-col bg-background text-foreground">
    <header class="z-40 flex shrink-0 items-center gap-3 border-b bg-card px-3 py-2 shadow-sm sm:px-5">
      <RouterLink to="/hosts" class="mr-2 text-base font-bold tracking-tight text-primary">Radar</RouterLink>
      <nav class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Primary navigation">
        <RouterLink
          v-for="item in navigation.filter(showNav)"
          :key="item.to"
          :to="item.to"
          class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :class="isNavActive(item) ? 'bg-accent text-foreground' : ''"
        >
          <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <Button variant="outline" size="icon" :title="`Theme: ${theme}. Click to cycle.`" :aria-label="`Theme: ${theme}`" @click="cycleTheme">
        <Moon v-if="theme === 'dark'" class="h-4 w-4" />
        <Sun v-else-if="theme === 'light'" class="h-4 w-4" />
        <Monitor v-else class="h-4 w-4" />
      </Button>
      <Button v-if="isAuthenticated" variant="ghost" size="sm" @click="logout">
        <LogOut class="h-4 w-4" aria-hidden="true" /> Logout
      </Button>
      <Button v-else variant="ghost" size="sm" @click="router.push('/login')">
        <LogIn class="h-4 w-4" aria-hidden="true" /> Login
      </Button>
    </header>
    <main class="flex min-h-0 flex-1 flex-col"><RouterView /></main>
  </div>
</template>
