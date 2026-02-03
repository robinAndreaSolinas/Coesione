import { ref, watch } from 'vue'

const STORAGE_KEY = 'coesione-users'

export interface AppUser {
  id: string
  name: string
  email: string
  active: boolean
  role: string
  password?: string
}

const defaultUsers: AppUser[] = [
  {
    id: '1',
    name: 'Andrea',
    email: 'andrea@example.com',
    active: true,
    role: 'Admin',
  },
  {
    id: '2',
    name: 'Redazione',
    email: 'redazione@example.com',
    active: true,
    role: 'Editor',
  },
  {
    id: '3',
    name: 'Marketing',
    email: 'marketing@example.com',
    active: false,
    role: 'Viewer',
  },
]

function loadUsers(): AppUser[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as AppUser[]
      return parsed.length ? parsed : defaultUsers
    }
  } catch {
    // ignore
  }
  return [...defaultUsers]
}

const users = ref<AppUser[]>(loadUsers())

watch(
  users,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true }
)

export function useUsers() {
  const addUser = () => {
    const id = Date.now().toString()
    users.value.push({
      id,
      name: 'Nuovo utente',
      email: `user${id}@example.com`,
      active: true,
      role: 'Viewer',
    })
  }

  const removeUser = (id: string) => {
    users.value = users.value.filter((u) => u.id !== id)
  }

  return {
    users,
    addUser,
    removeUser,
  }
}

