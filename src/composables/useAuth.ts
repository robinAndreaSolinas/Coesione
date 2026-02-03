import { ref, computed, onMounted } from 'vue'
import { api, type ApiUser } from '@/api/client'

const TOKEN_KEY = 'coesione-token'

const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
const currentUserData = ref<ApiUser | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)

  const currentUser = computed(() => currentUserData.value)

  async function fetchMe() {
    if (!token.value) return null
    try {
      currentUserData.value = await api.auth.me()
      return currentUserData.value
    } catch {
      token.value = null
      localStorage.removeItem(TOKEN_KEY)
      currentUserData.value = null
      return null
    }
  }

  async function login(email: string, password: string) {
    const { token: t, user } = await api.auth.login(email, password)
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
    currentUserData.value = user
    return user
  }

  async function updateProfile(data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) {
    const updated = await api.auth.updateMe(data)
    currentUserData.value = updated
    return updated
  }

  function logout() {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
    currentUserData.value = null
  }

  onMounted(() => {
    if (token.value && !currentUserData.value) fetchMe()
  })

  return {
    isAuthenticated,
    currentUser,
    login,
    logout,
    fetchMe,
    updateProfile,
  }
}

export function getToken() {
  return token.value
}
