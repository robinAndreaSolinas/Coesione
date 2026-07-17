import bcrypt from 'bcryptjs'
import type Database from 'better-sqlite3'

const ADMIN_EMAIL = 'admin@monrif.net'
const ADMIN_PASSWORD = '5nB+#w4~,]p0k8V=}LWs!u+Nn'

/**
 * Seed idempotente: se un obiettivo esiste già nel DB, value/unit NON vengono toccati.
 * Solo INSERT OR IGNORE per id mancanti + rename title/metadata senza alterare i target.
 */
export function seed(db: Database.Database) {
  ensureAdminUser(db)
  ensurePageVisibility(db)
  removeObsoleteObjectives(db)
  migrateSocialViewsToInteractions(db)
  insertMissingObjectives(db)
  updateObjectiveTitlesOnly(db)
}

function ensureAdminUser(db: Database.Database) {
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ? LIMIT 1')
    .get(ADMIN_EMAIL) as { id: string } | undefined
  if (existing) return

  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, active, role) VALUES (?, ?, ?, ?, 1, ?)'
  ).run('1', 'Admin', ADMIN_EMAIL, hash, 'Admin')
}

function ensurePageVisibility(db: Database.Database) {
  const pages = ['Totale', 'Social', 'Video', 'Newsletter', 'Siti', 'Sondaggi']
  const insertPage = db.prepare(
    'INSERT OR IGNORE INTO page_visibility (page_key, is_public, is_visible_for_users) VALUES (?, 0, 1)'
  )
  for (const p of pages) {
    insertPage.run(p)
  }
}

function removeObsoleteObjectives(db: Database.Database) {
  for (const removedId of [
    'surveys-completion-rate',
    'social-audience',
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
}

/** Rinomina id legacy senza resettare value/unit già presenti. */
function migrateSocialViewsToInteractions(db: Database.Database) {
  const hasInteractions = db
    .prepare("SELECT 1 AS ok FROM objectives WHERE id = 'social-interactions' LIMIT 1")
    .get() as { ok: number } | undefined
  if (hasInteractions) {
    db.prepare("DELETE FROM objectives WHERE id = 'social-views'").run()
    return
  }
  db.prepare(
    `UPDATE objectives SET id = 'social-interactions', title = 'Interazioni' WHERE id = 'social-views'`
  ).run()
}

function insertMissingObjectives(db: Database.Database) {
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
}

/** Solo title/category/path — mai value né unit. */
function updateObjectiveTitlesOnly(db: Database.Database) {
  const titleUpdates: Array<{ id: string; title: string; category?: string; path?: string }> = [
    { id: 'newsletter-subscribers-active', title: 'Destinatari' },
    { id: 'articles-pageviews', title: 'Pagine viste medie per articolo' },
    { id: 'social-facebook-post-count', title: 'Facebook · Contenuti pubblicati' },
    { id: 'social-x-post-count', title: 'X · Contenuti pubblicati' },
    { id: 'articles-printed-count', title: 'Articoli Stampati' },
    { id: 'surveys-participants-count', title: 'Utenti unici' },
    { id: 'sondaggi-satisfaction-rate', title: 'Satisfaction rate structured dialogues' },
    {
      id: 'multimedia-engagement-rate',
      title: 'WP2 · ER Multimedia content',
      category: 'totale',
      path: '/',
    },
  ]

  for (const u of titleUpdates) {
    if (u.category != null && u.path != null) {
      db.prepare(
        'UPDATE objectives SET title = ?, category = ?, path = ? WHERE id = ?'
      ).run(u.title, u.category, u.path, u.id)
    } else {
      db.prepare('UPDATE objectives SET title = ? WHERE id = ?').run(u.title, u.id)
    }
  }
}
