import { ref, onMounted } from 'vue'
import { api } from '@/api/client'

export interface AdminVisibilitySettings {
  isPublic: boolean
  isVisibleForUsers: boolean
}

type SettingsMap = Record<string, AdminVisibilitySettings>

const settings = ref<SettingsMap>({})

export function useAdminVisibility() {
  async function loadSettings() {
    try {
      settings.value = await api.pages.getVisibility()
    } catch {
      settings.value = {}
    }
  }

  function ensureSettings(key: string): AdminVisibilitySettings {
    if (!settings.value[key]) {
      settings.value[key] = { isPublic: false, isVisibleForUsers: true }
    }
    return settings.value[key]
  }

  function getSettings(key: string): AdminVisibilitySettings {
    return ensureSettings(key)
  }

  async function setPublic(key: string, value: boolean) {
    const s = ensureSettings(key)
    s.isPublic = value
    if (value) s.isVisibleForUsers = true
    try {
      await api.pages.setVisibility(key, s)
    } catch {
      s.isPublic = !value
      if (value) s.isVisibleForUsers = false
    }
  }

  async function setVisibleForUsers(key: string, value: boolean) {
    const s = ensureSettings(key)
    s.isVisibleForUsers = value
    try {
      await api.pages.setVisibility(key, s)
    } catch {
      s.isVisibleForUsers = !value
    }
  }

  onMounted(loadSettings)

  return {
    settings,
    getSettings,
    setPublic,
    setVisibleForUsers,
    loadSettings,
  }
}
