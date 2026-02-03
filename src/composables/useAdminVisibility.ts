import { ref, watch } from 'vue'

const STORAGE_KEY = 'coesione-admin-visibility'

export interface AdminVisibilitySettings {
  isPublic: boolean
  isVisibleForUsers: boolean
}

type SettingsMap = Record<string, AdminVisibilitySettings>

const settings = ref<SettingsMap>({})

function loadSettings(): SettingsMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as SettingsMap
    }
  } catch {
    // ignore
  }
  return {}
}

settings.value = loadSettings()

watch(
  settings,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true }
)

export function useAdminVisibility() {
  const ensureSettings = (key: string): AdminVisibilitySettings => {
    if (!settings.value[key]) {
      settings.value[key] = {
        isPublic: false,
        isVisibleForUsers: true,
      }
    }
    return settings.value[key]
  }

  const getSettings = (key: string): AdminVisibilitySettings => {
    return ensureSettings(key)
  }

  const setPublic = (key: string, value: boolean) => {
    ensureSettings(key).isPublic = value
  }

  const setVisibleForUsers = (key: string, value: boolean) => {
    ensureSettings(key).isVisibleForUsers = value
  }

  return {
    getSettings,
    setPublic,
    setVisibleForUsers,
  }
}

