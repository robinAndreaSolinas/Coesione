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
  db.prepare('DELETE FROM objectives WHERE id = ?').run('social-audience')
  for (const removedId of [
    'social-shares',
    'social-comments',
    'siti-regional-development-understanding',
    'siti-cohesion-advocacy',
    'surveys-average-responses',
    'video-completion-rate',
    'newsletter-subscribers-total',
    'social-youtube-engagement-rate',
    'social-youtube-reach',
    'social-youtube-post-count',
  ]) {
    db.prepare('DELETE FROM objectives WHERE id = ?').run(removedId)
  }
  // social-views → social-interactions (evita UNIQUE se entrambi esistono già)
  const hasInteractions = db
    .prepare("SELECT 1 AS ok FROM objectives WHERE id = 'social-interactions' LIMIT 1")
    .get() as { ok: number } | undefined
  if (hasInteractions) {
    db.prepare("DELETE FROM objectives WHERE id = 'social-views'").run()
  } else {
    db.prepare(
      `UPDATE objectives SET id = 'social-interactions', title = 'Interazioni', value = 50000, unit = 'K' WHERE id = 'social-views'`
    ).run()
  }

  const objCount = db.prepare('SELECT COUNT(*) as c FROM objectives').get() as { c: number }
  // Prosegui: inseriamo solo gli obiettivi mancanti (INSERT OR IGNORE).

  const objectives = [
    // Newsletter
    { id: 'newsletter-open-rate', title: 'Open rate (calcolato)', category: 'newsletter', path: '/newsletter', value: 0.4, unit: '%' },
    { id: 'newsletter-click-rate', title: 'Click rate (calcolato)', category: 'newsletter', path: '/newsletter', value: 0.05, unit: '%' },
    { id: 'newsletter-subscribers-active', title: 'Destinatari', category: 'newsletter', path: '/newsletter', value: 8_000, unit: 'K' },
    { id: 'newsletter-sent', title: 'Policy briefs e newsletter distribuiti', category: 'newsletter', path: '/newsletter', value: 12, unit: '' },
    { id: 'newsletter-feedback-positive', title: 'Feedback positivo (qualitativo)', category: 'newsletter', path: '/newsletter', value: 0.7, unit: '%' },

    // Siti
    { id: 'articles-unique-users', title: 'Utenti unici articoli', category: 'siti', path: '/siti', value: 50_000, unit: 'K' },
    { id: 'articles-pageviews', title: 'Pagine viste medie per articolo', category: 'siti', path: '/siti', value: 3_000, unit: '' },
    { id: 'articles-published-count', title: 'Numero articoli pubblicati', category: 'siti', path: '/siti', value: 500, unit: '' },
    { id: 'articles-printed-count', title: 'Articoli Stampati', category: 'siti', path: '/siti', value: 40, unit: '' },
    { id: 'articles-digital-count', title: 'Articoli digitali (web)', category: 'siti', path: '/siti', value: 190, unit: '' },

    // Social
    { id: 'social-engagement-rate', title: 'Engagement rate (calcolato)', category: 'social', path: '/social', value: 0.05, unit: '%' },
    { id: 'social-posts-count', title: 'Numero post', category: 'social', path: '/social', value: 306, unit: '' },
    { id: 'social-interactions', title: 'Interazioni', category: 'social', path: '/social', value: 50_000, unit: 'K' },
    { id: 'social-comments', title: 'Commenti', category: 'social', path: '/social', value: 5_000, unit: 'K' },
    { id: 'social-reach', title: 'Reach', category: 'social', path: '/social', value: 3_000_000, unit: 'M' },

    // Social · Facebook
    { id: 'social-facebook-engagement-rate', title: 'Facebook · Engagement rate', category: 'social', path: '/social', value: 0.014, unit: '%' },
    { id: 'social-facebook-reach', title: 'Facebook · Reach', category: 'social', path: '/social', value: 2_000, unit: 'K' },
    { id: 'social-facebook-post-count', title: 'Facebook · Contenuti pubblicati', category: 'social', path: '/social', value: 100, unit: '' },

    // Social · Instagram
    { id: 'social-instagram-engagement-rate', title: 'Instagram · Engagement rate', category: 'social', path: '/social', value: 0.0737, unit: '%' },
    { id: 'social-instagram-reach', title: 'Instagram · Reach', category: 'social', path: '/social', value: 19_000, unit: 'K' },
    { id: 'social-instagram-post-count', title: 'Instagram · Numero post', category: 'social', path: '/social', value: 100, unit: '' },

    // Social · TikTok
    { id: 'social-tiktok-engagement-rate', title: 'TikTok · Engagement rate', category: 'social', path: '/social', value: 0.0773, unit: '%' },
    { id: 'social-tiktok-reach', title: 'TikTok · Reach', category: 'social', path: '/social', value: 24_000, unit: 'K' },
    { id: 'social-tiktok-post-count', title: 'TikTok · Numero post', category: 'social', path: '/social', value: 100, unit: '' },

    // Social · X
    { id: 'social-x-engagement-rate', title: 'X · Engagement rate', category: 'social', path: '/social', value: 0.01, unit: '%' },
    { id: 'social-x-reach', title: 'X · Reach', category: 'social', path: '/social', value: 2_000, unit: 'K' },
    { id: 'social-x-post-count', title: 'X · Contenuti pubblicati', category: 'social', path: '/social', value: 100, unit: '' },

    // Video
    { id: 'video-audiovisual-count', title: 'Numero di Audiovisual', category: 'video', path: '/video', value: 12, unit: '' },
    { id: 'video-audience', title: 'Audience', category: 'video', path: '/video', value: 200_000, unit: 'K' },
    { id: 'video-minutes-watched', title: 'Minuti guardati', category: 'video', path: '/video', value: 1_000_000, unit: 'M' },

    // Totale (WP2)
    { id: 'multimedia-engagement-rate', title: 'WP2 · ER Multimedia content', category: 'totale', path: '/', value: 0.1, unit: '%' },

    // Sondaggi
    { id: 'surveys-count', title: 'Numero sondaggi', category: 'sondaggi', path: '/sondaggi', value: 5, unit: '' },
    { id: 'surveys-participants-count', title: 'Utenti unici', category: 'sondaggi', path: '/sondaggi', value: 1_000, unit: '' },
    { id: 'surveys-total-responses', title: 'Risposte totali', category: 'sondaggi', path: '/sondaggi', value: 10_000, unit: '' },
    { id: 'sondaggi-engagement-rate', title: 'Engagement rate', category: 'sondaggi', path: '/sondaggi', value: 0.01, unit: '%' },
    { id: 'sondaggi-regional-development-understanding', title: 'Improved understanding Regional Development', category: 'sondaggi', path: '/sondaggi', value: 0.8, unit: '%' },
    { id: 'sondaggi-cohesion-advocacy', title: 'Cohesion Advocacy', category: 'sondaggi', path: '/sondaggi', value: 0.15, unit: '%' },
    { id: 'sondaggi-satisfaction-rate', title: 'Satisfaction rate structured dialogues', category: 'sondaggi', path: '/sondaggi', value: 4, unit: '' },
  ]
  const insertObj = db.prepare(
    'INSERT OR IGNORE INTO objectives (id, title, category, path, value, unit) VALUES (?, ?, ?, ?, ?, ?)'
  )
  for (const o of objectives) {
    insertObj.run(o.id, o.title, o.category, o.path, o.value, o.unit)
  }

  db.prepare(
    `UPDATE objectives SET title = 'Destinatari' WHERE id = 'newsletter-subscribers-active'`
  ).run()
  db.prepare(
    `UPDATE objectives SET title = 'Pagine viste medie per articolo', value = 3000, unit = '' WHERE id = 'articles-pageviews'`
  ).run()
  db.prepare(
    `UPDATE objectives SET title = 'Facebook · Contenuti pubblicati' WHERE id = 'social-facebook-post-count'`
  ).run()
  db.prepare(
    `UPDATE objectives SET title = 'X · Contenuti pubblicati' WHERE id = 'social-x-post-count'`
  ).run()
  db.prepare(
    `UPDATE objectives SET title = 'Articoli Stampati' WHERE id = 'articles-printed-count'`
  ).run()
  db.prepare(
    `UPDATE objectives SET title = 'Utenti unici', value = 1000, unit = '' WHERE id = 'surveys-participants-count'`
  ).run()
  db.prepare(
    `UPDATE objectives SET value = 10000, unit = '' WHERE id = 'surveys-total-responses'`
  ).run()
  db.prepare(
    `UPDATE objectives SET value = 5 WHERE id = 'surveys-count'`
  ).run()
  db.prepare(
    `UPDATE objectives SET title = 'Satisfaction rate structured dialogues' WHERE id = 'sondaggi-satisfaction-rate'`
  ).run()
  db.prepare(
    `UPDATE objectives SET title = 'WP2 · ER Multimedia content', value = 0.1, unit = '%', category = 'totale', path = '/' WHERE id = 'multimedia-engagement-rate'`
  ).run()
}
