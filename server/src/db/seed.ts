import bcrypt from 'bcryptjs'
import type Database from 'better-sqlite3'

const ADMIN_EMAIL = 'admin@monrif.net'
const ADMIN_PASSWORD = '5nB+#w4~,]p0k8V=}LWs!u+Nn'

export function seed(db: Database.Database) {
  db.prepare('DELETE FROM users').run()
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, active, role) VALUES (?, ?, ?, ?, 1, ?)'
  ).run('1', 'Admin', ADMIN_EMAIL, hash, 'Admin')

  const pages = ['Totale', 'Social', 'Video', 'Newsletter', 'Siti', 'Sondaggi']
  const insertPage = db.prepare(
    'INSERT OR IGNORE INTO page_visibility (page_key, is_public, is_visible_for_users) VALUES (?, 0, 1)'
  )
  for (const p of pages) {
    insertPage.run(p)
  }

  const objCount = db.prepare('SELECT COUNT(*) as c FROM objectives').get() as { c: number }
  if (objCount.c > 0) return

  const objectives = [
    { id: 'engagement-rate', title: 'Engagement rate (engage/reach)', category: 'social', path: '/social', value: 5, unit: '%' },
    { id: 'utenti-unici', title: 'Utenti unici giornalieri', category: 'siti', path: '/siti', value: 50, unit: 'K' },
    { id: 'audience-video', title: 'Audience video', category: 'video', path: '/video', value: 1, unit: 'M' },
    { id: 'survey-newsletter', title: 'Survey newsletter', category: 'sondaggi', path: '/sondaggi', value: 10, unit: 'K' },
    { id: 'articoli-pubblicati', title: 'Numero articoli pubblicati', category: 'siti', path: '/siti', value: 500, unit: '' },
    { id: 'pagine-viste', title: 'Pagine viste', category: 'siti', path: '/siti', value: 1.5, unit: 'M' },
    { id: 'newsletter-rate', title: 'Newsletter open rate e click rate', category: 'newsletter', path: '/newsletter', value: 45, unit: '%' },
  ]
  const insertObj = db.prepare(
    'INSERT INTO objectives (id, title, category, path, value, unit) VALUES (?, ?, ?, ?, ?, ?)'
  )
  for (const o of objectives) {
    insertObj.run(o.id, o.title, o.category, o.path, o.value, o.unit)
  }
}
