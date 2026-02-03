import { computed, ref, watch } from 'vue'
import { useUsers } from './useUsers'

const STORAGE_KEY = 'coesione-current-user-id'

const currentUserId = ref<string | null>(null)

function initCurrentUserId(defaultId: string | null) {
  if (currentUserId.value !== null) return
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      currentUserId.value = stored
      return
    }
  } catch {
    // ignore
  }
  currentUserId.value = defaultId
}

export function useCurrentUser() {
  const { users } = useUsers()

  const currentUser = computed(() => {
    const list = users.value
    if (!list.length) return null

    initCurrentUserId(list[0]?.id ?? null)

    const found = list.find((u) => u.id === currentUserId.value)
    return found ?? list[0]
  })

  const setCurrentUser = (id: string) => {
    currentUserId.value = id
  }

  watch(
    currentUserId,
    (val) => {
      if (val) {
        localStorage.setItem(STORAGE_KEY, val)
      }
    },
    { immediate: false }
  )

  return { currentUser, setCurrentUser }
}

