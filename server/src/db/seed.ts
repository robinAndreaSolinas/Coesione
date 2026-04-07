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

  // Rimuove indicatori non presenti nel documento indicatori/output
  // (evita che restino visibili anche se il DB era già stato inizializzato)
  db.prepare('DELETE FROM objectives WHERE id = ?').run('surveys-completion-rate')

  const objCount = db.prepare('SELECT COUNT(*) as c FROM objectives').get() as { c: number }
  // Prosegui: inseriamo solo gli obiettivi mancanti (INSERT OR IGNORE).

  const objectives = [
    // Newsletter
    { id: 'newsletter-open-rate', title: 'Open rate (calcolato)', category: 'newsletter', path: '/newsletter', value: 0.4, unit: '%' },
    { id: 'newsletter-click-rate', title: 'Click rate (calcolato)', category: 'newsletter', path: '/newsletter', value: 0.05, unit: '%' },
    { id: 'newsletter-subscribers-total', title: 'Iscritti totali', category: 'newsletter', path: '/newsletter', value: 10_000, unit: 'K' },
    { id: 'newsletter-subscribers-active', title: 'Iscritti attivi', category: 'newsletter', path: '/newsletter', value: 8_000, unit: 'K' },

    // Siti
    { id: 'articles-unique-users', title: 'Utenti unici articoli', category: 'siti', path: '/siti', value: 50_000, unit: 'K' },
    { id: 'articles-pageviews', title: 'Pagine viste articoli', category: 'siti', path: '/siti', value: 1_500_000, unit: 'M' },
    { id: 'articles-published-count', title: 'Numero articoli pubblicati', category: 'siti', path: '/siti', value: 500, unit: '' },
    { id: 'articles-printed-count', title: 'Articoli stampati (carta)', category: 'siti', path: '/siti', value: 40, unit: '' },
    { id: 'articles-digital-count', title: 'Articoli digitali (web)', category: 'siti', path: '/siti', value: 190, unit: '' },

    // Social
    { id: 'social-engagement-rate', title: 'Engagement rate (calcolato)', category: 'social', path: '/social', value: 0.05, unit: '%' },
    { id: 'social-posts-count', title: 'Numero post', category: 'social', path: '/social', value: 306, unit: '' },
    { id: 'social-views', title: 'Views', category: 'social', path: '/social', value: 2_000_000, unit: 'M' },
    { id: 'social-audience', title: 'Audience', category: 'social', path: '/social', value: 500_000, unit: 'K' },
    { id: 'social-shares', title: 'Condivisioni', category: 'social', path: '/social', value: 10_000, unit: 'K' },
    { id: 'social-comments', title: 'Commenti', category: 'social', path: '/social', value: 5_000, unit: 'K' },
    { id: 'social-reach', title: 'Reach', category: 'social', path: '/social', value: 3_000_000, unit: 'M' },

    // Video
    { id: 'video-audiovisual-count', title: 'Numero di Audiovisual', category: 'video', path: '/video', value: 12, unit: '' },
    { id: 'video-audience', title: 'Audience', category: 'video', path: '/video', value: 200_000, unit: 'K' },
    { id: 'video-minutes-watched', title: 'Minuti guardati', category: 'video', path: '/video', value: 1_000_000, unit: 'M' },
    { id: 'video-completion-rate', title: 'Completion rate', category: 'video', path: '/video', value: 0.6, unit: '%' },

    // Sondaggi
    { id: 'surveys-count', title: 'Numero sondaggi', category: 'sondaggi', path: '/sondaggi', value: 10, unit: '' },
    { id: 'surveys-total-responses', title: 'Risposte totali', category: 'sondaggi', path: '/sondaggi', value: 20_000, unit: 'K' },
    { id: 'surveys-average-responses', title: 'Media risposte sondaggio', category: 'sondaggi', path: '/sondaggi', value: 50, unit: '' },
  ]
  const insertObj = db.prepare(
    'INSERT OR IGNORE INTO objectives (id, title, category, path, value, unit) VALUES (?, ?, ?, ?, ?, ?)'
  )
  for (const o of objectives) {
    insertObj.run(o.id, o.title, o.category, o.path, o.value, o.unit)
  }
}
