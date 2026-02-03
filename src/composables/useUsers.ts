import { ref, onMounted } from 'vue'
import { api, type ApiUser } from '@/api/client'

export interface AppUser extends ApiUser {
  password?: string
}

const users = ref<AppUser[]>([])

export function useUsers() {
  async function loadUsers() {
    try {
      users.value = await api.users.list()
    } catch {
      users.value = []
    }
  }

  async function addUser(data: {
    name: string
    email: string
    password: string
    role?: string
  }) {
    const created = await api.users.create(data)
    users.value.push(created)
    return created
  }

  async function updateUser(
    id: string,
    data: Partial<AppUser> & { password?: string }
  ) {
    const updated = await api.users.update(id, data)
    const idx = users.value.findIndex((u) => u.id === id)
    if (idx >= 0) users.value[idx] = { ...users.value[idx], ...updated }
    return updated
  }

  async function removeUser(id: string) {
    await api.users.delete(id)
    users.value = users.value.filter((u) => u.id !== id)
  }

  onMounted(loadUsers)

  return {
    users,
    loadUsers,
    addUser,
    updateUser,
    removeUser,
  }
}
