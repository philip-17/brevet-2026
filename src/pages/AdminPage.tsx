import { useEffect, useState } from 'react'

/**
 * Tableau de bord privé (propriétaire uniquement), 2 onglets :
 *  - Avis : notes ⭐ + textes, et chats (résumé + conversation dépliable).
 *  - Connexions : tableau de toutes les connexions au site (date, IP, page, appareil).
 * Accès par code (vérifié côté serveur via ADMIN_PASSWORD). Rien n'est public.
 */

const KEY_LS = 'bb_admin_key'

type Review = {
  date: string
  name: string
  type: string
  rating: string
  text: string
  message: string
  reply: string
  conversation: string
  ip: string
}

type Connection = { date: string; ip: string; page: string; ua: string }

function frDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function uaShort(ua: string): string {
  if (!ua) return '—'
  let b = 'Autre'
  if (/edg/i.test(ua)) b = 'Edge'
  else if (/chrome|crios/i.test(ua)) b = 'Chrome'
  else if (/firefox|fxios/i.test(ua)) b = 'Firefox'
  else if (/safari/i.test(ua)) b = 'Safari'
  let os = ''
  if (/iphone|ipad|ios/i.test(ua)) os = 'iOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/windows/i.test(ua)) os = 'Windows'
  else if (/mac os|macintosh/i.test(ua)) os = 'Mac'
  else if (/linux/i.test(ua)) os = 'Linux'
  const mobile = /mobile|android|iphone/i.test(ua) ? ' 📱' : ''
  return `${b}${os ? ' · ' + os : ''}${mobile}`
}

async function apiPost(payload: unknown): Promise<Response> {
  return fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
}

export default function AdminPage() {
  const [key, setKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'avis' | 'connexions'>('avis')

  const [reviews, setReviews] = useState<Review[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [connLoaded, setConnLoaded] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const loadReviews = async (k: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost({ type: 'admin_list', key: k })
      if (res.status === 401) {
        setError('Code incorrect.')
        setAuthed(false)
        localStorage.removeItem(KEY_LS)
        return
      }
      if (!res.ok) throw new Error('Erreur ' + res.status)
      const data = await res.json()
      setReviews(data.reviews || [])
      setAuthed(true)
      localStorage.setItem(KEY_LS, k)
    } catch (e) {
      setError(String((e as Error).message || e))
    } finally {
      setLoading(false)
    }
  }

  const loadConnections = async (k: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiPost({ type: 'admin_connections', key: k })
      if (!res.ok) throw new Error('Erreur ' + res.status)
      const data = await res.json()
      setConnections(data.connections || [])
      setConnLoaded(true)
    } catch (e) {
      setError(String((e as Error).message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const k = localStorage.getItem(KEY_LS)
    if (k) {
      setKey(k)
      loadReviews(k)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goTab = (t: 'avis' | 'connexions') => {
    setTab(t)
    if (t === 'connexions' && !connLoaded) loadConnections(key)
  }

  const refresh = () => (tab === 'avis' ? loadReviews(key) : loadConnections(key))

  const logout = () => {
    localStorage.removeItem(KEY_LS)
    setAuthed(false)
    setKey('')
    setReviews([])
    setConnections([])
    setConnLoaded(false)
  }

  // Stats avis
  const ratings = reviews.filter((r) => r.type === 'avis').map((r) => parseInt(r.rating, 10)).filter((n) => !isNaN(n))
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '–'
  const nbChat = reviews.filter((r) => r.type === 'chat').length
  const ipCountsReviews: Record<string, number> = {}
  reviews.forEach((r) => {
    if (r.ip) ipCountsReviews[r.ip] = (ipCountsReviews[r.ip] || 0) + 1
  })

  // Stats connexions
  const uniqueIps = new Set(connections.map((c) => c.ip).filter(Boolean)).size
  const ipCountsConn: Record<string, number> = {}
  connections.forEach((c) => {
    if (c.ip) ipCountsConn[c.ip] = (ipCountsConn[c.ip] || 0) + 1
  })

  if (!authed) {
    return (
      <div className="bbadm">
        <style>{styles}</style>
        <div className="bbadm-gate">
          <div className="bbadm-card bbadm-gatecard">
            <h1>🔒 Admin BrevetBoost</h1>
            <p className="bbadm-muted">Espace privé. Entre ton code d'accès.</p>
            <input
              type="password"
              className="bbadm-input"
              placeholder="Code d'accès"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadReviews(key)}
              autoFocus
            />
            {error && <div className="bbadm-err">{error}</div>}
            <button className="bbadm-btn" onClick={() => loadReviews(key)} disabled={loading || !key}>
              {loading ? '…' : 'Entrer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bbadm">
      <style>{styles}</style>
      <div className="bbadm-wrap">
        <header className="bbadm-head">
          <h1>Admin BrevetBoost</h1>
          <div className="bbadm-actions">
            <button className="bbadm-mini" onClick={refresh} disabled={loading}>
              {loading ? '…' : '↻ Rafraîchir'}
            </button>
            <button className="bbadm-mini ghost" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </header>

        <div className="bbadm-tabs">
          <button className={'bbadm-tab ' + (tab === 'avis' ? 'on' : '')} onClick={() => goTab('avis')}>
            ⭐ Avis ({reviews.length})
          </button>
          <button className={'bbadm-tab ' + (tab === 'connexions' ? 'on' : '')} onClick={() => goTab('connexions')}>
            🌐 Connexions{connLoaded ? ` (${connections.length})` : ''}
          </button>
        </div>

        {error && <div className="bbadm-err">{error}</div>}

        {/* ───── ONGLET AVIS ───── */}
        {tab === 'avis' && (
          <>
            <p className="bbadm-muted bbadm-stats">{reviews.length} avis · note moyenne {avg} ⭐ · {nbChat} discussions</p>
            {!loading && reviews.length === 0 && <p className="bbadm-muted">Aucun avis pour l'instant.</p>}
            <div className="bbadm-list">
              {reviews.map((r, i) => (
                <div className="bbadm-item" key={i}>
                  <div className="bbadm-row1">
                    <span className="bbadm-name">{r.name || 'Anonyme'}</span>
                    <span className={'bbadm-badge ' + r.type}>{r.type === 'chat' ? '💬 chat' : '⭐ avis'}</span>
                    {r.ip && ipCountsReviews[r.ip] > 1 && <span className="bbadm-badge dup">⚠️ même IP ×{ipCountsReviews[r.ip]}</span>}
                    <span className="bbadm-date">{frDate(r.date)}</span>
                  </div>
                  {r.ip && <div className="bbadm-ip">IP : {r.ip}</div>}
                  {r.type === 'avis' ? (
                    <>
                      <div className="bbadm-stars">
                        {'★'.repeat(parseInt(r.rating, 10) || 0)}
                        <span className="bbadm-staroff">{'★'.repeat(Math.max(0, 5 - (parseInt(r.rating, 10) || 0)))}</span>
                      </div>
                      {r.text && <div className="bbadm-text">{r.text}</div>}
                    </>
                  ) : (
                    <>
                      <div className="bbadm-text">{r.text || '(résumé indisponible)'}</div>
                      {r.conversation && (
                        <>
                          <button className="bbadm-toggle" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                            {openIdx === i ? '▾ Masquer la conversation' : '▸ Voir la conversation'}
                          </button>
                          {openIdx === i && <pre className="bbadm-convo">{r.conversation}</pre>}
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ───── ONGLET CONNEXIONS ───── */}
        {tab === 'connexions' && (
          <>
            <p className="bbadm-muted bbadm-stats">{connections.length} connexions · {uniqueIps} IP différentes</p>
            {!loading && connections.length === 0 && <p className="bbadm-muted">Aucune connexion enregistrée pour l'instant.</p>}
            {connections.length > 0 && (
              <div className="bbadm-tablewrap">
                <table className="bbadm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>IP</th>
                      <th>Page</th>
                      <th>Appareil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((c, i) => (
                      <tr key={i}>
                        <td className="bbadm-td-date">{frDate(c.date)}</td>
                        <td className="bbadm-mono">
                          {c.ip || '—'}
                          {c.ip && ipCountsConn[c.ip] > 1 && <span className="bbadm-x">×{ipCountsConn[c.ip]}</span>}
                        </td>
                        <td className="bbadm-mono">{c.page || '/'}</td>
                        <td>{uaShort(c.ua)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles = `
.bbadm{min-height:100vh;background:#0a0612;color:#f5f6ff;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",system-ui,sans-serif}
.bbadm *{box-sizing:border-box}
.bbadm-muted{color:rgba(245,246,255,.6);font-size:14px;margin:4px 0 0}
.bbadm-stats{margin:0 0 16px}
.bbadm-err{color:#ff8585;font-size:14px;margin:10px 0}
.bbadm-input{width:100%;padding:14px 16px;margin:14px 0;color:#f5f6ff;font:inherit;font-size:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.2);border-radius:14px;outline:none}
.bbadm-input:focus{border-color:rgba(255,255,255,.5)}
.bbadm-btn{width:100%;padding:14px;font:inherit;font-size:16px;font-weight:600;color:#fff;cursor:pointer;border:none;border-radius:14px;background:linear-gradient(180deg,#7c3aed,#ec4899)}
.bbadm-btn:disabled{opacity:.5;cursor:not-allowed}
.bbadm-gate{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.bbadm-gatecard{max-width:380px;width:100%}
.bbadm-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:26px}
.bbadm-card h1{font-size:22px;margin:0 0 4px}
.bbadm-wrap{max-width:880px;margin:0 auto;padding:26px 18px 60px}
.bbadm-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}
.bbadm-head h1{font-size:26px;margin:0;letter-spacing:-.02em}
.bbadm-actions{display:flex;gap:8px}
.bbadm-mini{padding:9px 13px;font:inherit;font-size:13px;color:#fff;cursor:pointer;border-radius:11px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08)}
.bbadm-mini.ghost{background:none;opacity:.7}
.bbadm-mini:hover{background:rgba(255,255,255,.15)}
.bbadm-tabs{display:flex;gap:8px;margin-bottom:18px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:0}
.bbadm-tab{padding:10px 16px;font:inherit;font-size:14.5px;color:rgba(245,246,255,.6);cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-1px}
.bbadm-tab.on{color:#fff;border-bottom-color:#ec4899;font-weight:600}
.bbadm-tab:hover{color:#fff}
.bbadm-list{display:flex;flex-direction:column;gap:12px}
.bbadm-item{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:16px 18px}
.bbadm-row1{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.bbadm-name{font-weight:700;font-size:15.5px}
.bbadm-badge{font-size:12px;padding:3px 9px;border-radius:99px;border:1px solid rgba(255,255,255,.18)}
.bbadm-badge.avis{background:rgba(255,213,74,.14);color:#ffd54a}
.bbadm-badge.chat{background:rgba(124,58,237,.18);color:#c9a8ff}
.bbadm-badge.dup{background:rgba(255,133,133,.18);color:#ff9d9d}
.bbadm-ip{font-size:12px;color:rgba(245,246,255,.42);margin:0 0 6px;font-family:ui-monospace,Menlo,monospace}
.bbadm-date{margin-left:auto;font-size:12.5px;color:rgba(245,246,255,.45)}
.bbadm-stars{color:#ffd54a;font-size:18px;letter-spacing:2px;margin:2px 0 6px}
.bbadm-staroff{color:rgba(255,255,255,.18)}
.bbadm-text{font-size:15px;line-height:1.5;color:rgba(245,246,255,.92)}
.bbadm-toggle{margin-top:10px;background:none;border:none;color:#c9a8ff;cursor:pointer;font:inherit;font-size:13.5px;padding:0}
.bbadm-toggle:hover{text-decoration:underline}
.bbadm-convo{margin:10px 0 0;padding:14px;white-space:pre-wrap;word-break:break-word;font:inherit;font-size:14px;line-height:1.55;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:rgba(245,246,255,.85)}
.bbadm-tablewrap{overflow-x:auto;border:1px solid rgba(255,255,255,.12);border-radius:14px}
.bbadm-table{width:100%;border-collapse:collapse;font-size:14px}
.bbadm-table th{text-align:left;padding:11px 14px;background:rgba(255,255,255,.06);color:rgba(245,246,255,.7);font-weight:600;font-size:12.5px;text-transform:uppercase;letter-spacing:.03em}
.bbadm-table td{padding:11px 14px;border-top:1px solid rgba(255,255,255,.08);color:rgba(245,246,255,.9)}
.bbadm-table tr:hover td{background:rgba(255,255,255,.03)}
.bbadm-td-date{white-space:nowrap;color:rgba(245,246,255,.6)}
.bbadm-mono{font-family:ui-monospace,Menlo,monospace;font-size:13px}
.bbadm-x{margin-left:6px;font-size:11px;color:#ff9d9d}
`
