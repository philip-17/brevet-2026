import { useEffect, useState } from 'react'

/**
 * Tableau de bord privé (propriétaire). 3 onglets : Avis, Connexions, Analyse.
 * Données via /api/review (admin_list / admin_connections). Accès par code (ADMIN_PASSWORD).
 */

const KEY_LS = 'bb_admin_key'

type Review = {
  date: string; name: string; type: string; rating: string
  text: string; message: string; reply: string; conversation: string; ip: string
}
type Connection = { date: string; ip: string; page: string; ua: string; lieu: string }
type Tab = 'avis' | 'connexions' | 'analyse'

function frDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
const browserOf = (ua: string) => /edg/i.test(ua) ? 'Edge' : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Autre'
const osOf = (ua: string) => /iphone|ipad|ios/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac os|macintosh/i.test(ua) ? 'Mac' : /linux/i.test(ua) ? 'Linux' : 'Autre'
function uaShort(ua: string): string {
  if (!ua) return '—'
  const m = /mobile|android|iphone/i.test(ua) ? ' 📱' : ''
  return `${browserOf(ua)} · ${osOf(ua)}${m}`
}
function countBy<T>(arr: T[], key: (x: T) => string): [string, number][] {
  const m: Record<string, number> = {}
  arr.forEach((x) => { const k = key(x); if (k) m[k] = (m[k] || 0) + 1 })
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (s: unknown) => '"' + String(s ?? '').replace(/"/g, '""') + '"'
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n')
}
function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
async function apiPost(payload: unknown): Promise<Response> {
  return fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
}

export default function AdminPage() {
  const [key, setKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('avis')
  const [reviews, setReviews] = useState<Review[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [connLoaded, setConnLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const loadReviews = async (k: string) => {
    setLoading(true); setError('')
    try {
      const res = await apiPost({ type: 'admin_list', key: k })
      if (res.status === 401) { setError('Code incorrect.'); setAuthed(false); localStorage.removeItem(KEY_LS); return }
      if (!res.ok) throw new Error('Erreur ' + res.status)
      const data = await res.json()
      setReviews(data.reviews || []); setAuthed(true); localStorage.setItem(KEY_LS, k)
    } catch (e) { setError(String((e as Error).message || e)) } finally { setLoading(false) }
  }
  const loadConnections = async (k: string) => {
    setLoading(true); setError('')
    try {
      const res = await apiPost({ type: 'admin_connections', key: k })
      if (!res.ok) throw new Error('Erreur ' + res.status)
      const data = await res.json()
      setConnections(data.connections || []); setConnLoaded(true)
    } catch (e) { setError(String((e as Error).message || e)) } finally { setLoading(false) }
  }

  useEffect(() => {
    const k = localStorage.getItem(KEY_LS)
    if (k) { setKey(k); loadReviews(k) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goTab = (t: Tab) => {
    setTab(t)
    if ((t === 'connexions' || t === 'analyse') && !connLoaded) loadConnections(key)
  }
  const refresh = () => {
    loadReviews(key)
    if (connLoaded || tab !== 'avis') loadConnections(key)
  }
  const logout = () => {
    localStorage.removeItem(KEY_LS)
    setAuthed(false); setKey(''); setReviews([]); setConnections([]); setConnLoaded(false)
  }
  const clearReviews = async () => {
    if (!window.confirm('Vider TOUS les avis ? (irréversible)')) return
    await apiPost({ type: 'admin_clear', key }); loadReviews(key)
  }
  const clearConnections = async () => {
    if (!window.confirm('Vider TOUTES les connexions ? (irréversible)')) return
    await apiPost({ type: 'admin_clear_connections', key }); loadConnections(key)
  }
  const exportReviews = () => {
    const rows = reviews.map((r) => [r.date, r.name, r.type, r.rating, r.text, r.ip, r.conversation])
    downloadCSV('avis-brevetboost.csv', toCSV(['Horodatage', 'Nom', 'Type', 'Note', 'Avis/Résumé', 'IP', 'Conversation'], rows))
  }
  const exportConnections = () => {
    const rows = connections.map((c) => [c.date, c.ip, c.lieu, c.page, c.ua])
    downloadCSV('connexions-brevetboost.csv', toCSV(['Horodatage', 'IP', 'Lieu', 'Page', 'Navigateur'], rows))
  }

  // ── Agrégats ──
  const avisList = reviews.filter((r) => r.type === 'avis')
  const ratings = avisList.map((r) => parseInt(r.rating, 10)).filter((n) => !isNaN(n))
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '–'
  const nbChat = reviews.filter((r) => r.type === 'chat').length
  const ipCountsReviews: Record<string, number> = {}
  reviews.forEach((r) => { if (r.ip) ipCountsReviews[r.ip] = (ipCountsReviews[r.ip] || 0) + 1 })

  const uniqueIps = new Set(connections.map((c) => c.ip).filter(Boolean)).size
  const ipCountsConn: Record<string, number> = {}
  connections.forEach((c) => { if (c.ip) ipCountsConn[c.ip] = (ipCountsConn[c.ip] || 0) + 1 })
  const byDayConn: Record<string, number> = {}
  connections.forEach((c) => { const d = (c.date || '').slice(0, 10); if (d) byDayConn[d] = (byDayConn[d] || 0) + 1 })
  const days = Object.keys(byDayConn).sort().slice(-21)
  const maxDay = Math.max(1, ...days.map((d) => byDayConn[d]))

  // Analyse
  const ratingDist = [5, 4, 3, 2, 1].map((n) => ({ n, c: ratings.filter((r) => r === n).length }))
  const maxRating = Math.max(1, ...ratingDist.map((x) => x.c))
  const topPages = countBy(connections, (c) => c.page || '/').slice(0, 8)
  const byBrowser = countBy(connections, (c) => browserOf(c.ua))
  const byOS = countBy(connections, (c) => osOf(c.ua))
  const topLieux = countBy(connections, (c) => c.lieu || 'Inconnu').slice(0, 8)
  const maxPage = Math.max(1, ...topPages.map((p) => p[1]))

  if (!authed) {
    return (
      <div className="bbadm">
        <style>{styles}</style>
        <div className="bbadm-gate">
          <div className="bbadm-card bbadm-gatecard">
            <h1>🔒 Admin BrevetBoost</h1>
            <p className="bbadm-muted">Espace privé. Entre ton code d'accès.</p>
            <input type="password" className="bbadm-input" placeholder="Code d'accès" value={key}
              onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadReviews(key)} autoFocus />
            {error && <div className="bbadm-err">{error}</div>}
            <button className="bbadm-btn" onClick={() => loadReviews(key)} disabled={loading || !key}>{loading ? '…' : 'Entrer'}</button>
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
            <button className="bbadm-mini" onClick={refresh} disabled={loading}>{loading ? '…' : '↻ Rafraîchir'}</button>
            <button className="bbadm-mini ghost" onClick={logout}>Déconnexion</button>
          </div>
        </header>

        <div className="bbadm-tabs">
          <button className={'bbadm-tab ' + (tab === 'avis' ? 'on' : '')} onClick={() => goTab('avis')}>⭐ Avis ({reviews.length})</button>
          <button className={'bbadm-tab ' + (tab === 'connexions' ? 'on' : '')} onClick={() => goTab('connexions')}>🌐 Connexions{connLoaded ? ` (${connections.length})` : ''}</button>
          <button className={'bbadm-tab ' + (tab === 'analyse' ? 'on' : '')} onClick={() => goTab('analyse')}>📊 Analyse</button>
        </div>

        {error && <div className="bbadm-err">{error}</div>}

        {tab === 'avis' && (
          <>
            <div className="bbadm-bar">
              <span className="bbadm-muted">{reviews.length} avis · note moyenne {avg} ⭐ · {nbChat} discussions</span>
              <span className="bbadm-spacer" />
              <button className="bbadm-mini" onClick={exportReviews} disabled={!reviews.length}>⬇ CSV</button>
              <button className="bbadm-mini danger" onClick={clearReviews} disabled={!reviews.length}>🗑 Vider</button>
            </div>
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
                      <div className="bbadm-stars">{'★'.repeat(parseInt(r.rating, 10) || 0)}<span className="bbadm-staroff">{'★'.repeat(Math.max(0, 5 - (parseInt(r.rating, 10) || 0)))}</span></div>
                      {r.text && <div className="bbadm-text">{r.text}</div>}
                    </>
                  ) : (
                    <>
                      <div className="bbadm-text">{r.text || '(résumé indisponible)'}</div>
                      {r.conversation && (
                        <>
                          <button className="bbadm-toggle" onClick={() => setOpenIdx(openIdx === i ? null : i)}>{openIdx === i ? '▾ Masquer la conversation' : '▸ Voir la conversation'}</button>
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

        {tab === 'connexions' && (
          <>
            <div className="bbadm-bar">
              <span className="bbadm-muted">{connections.length} connexions · {uniqueIps} IP différentes</span>
              <span className="bbadm-spacer" />
              <button className="bbadm-mini" onClick={exportConnections} disabled={!connections.length}>⬇ CSV</button>
              <button className="bbadm-mini danger" onClick={clearConnections} disabled={!connections.length}>🗑 Vider</button>
            </div>
            {!loading && connections.length === 0 && <p className="bbadm-muted">Aucune connexion enregistrée pour l'instant.</p>}
            {days.length > 0 && (
              <div className="bbadm-chart">
                <div className="bbadm-chart-title">Visites par jour</div>
                <div className="bbadm-bars">
                  {days.map((d) => (
                    <div className="bbadm-barcol" key={d} title={`${d} : ${byDayConn[d]}`}>
                      <div className="bbadm-barval">{byDayConn[d]}</div>
                      <div className="bbadm-barfill" style={{ height: `${Math.max(6, (byDayConn[d] / maxDay) * 90)}px` }} />
                      <div className="bbadm-barlbl">{d.slice(8)}/{d.slice(5, 7)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {connections.length > 0 && (
              <div className="bbadm-tablewrap">
                <table className="bbadm-table">
                  <thead><tr><th>Date</th><th>IP</th><th>Lieu</th><th>Page</th><th>Appareil</th></tr></thead>
                  <tbody>
                    {connections.map((c, i) => (
                      <tr key={i}>
                        <td className="bbadm-td-date">{frDate(c.date)}</td>
                        <td className="bbadm-mono">{c.ip || '—'}{c.ip && ipCountsConn[c.ip] > 1 && <span className="bbadm-x">×{ipCountsConn[c.ip]}</span>}</td>
                        <td>{c.lieu || '—'}</td>
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

        {tab === 'analyse' && (
          <>
            <div className="bbadm-kpis">
              <div className="bbadm-kpi"><div className="bbadm-kpi-v">{avg}</div><div className="bbadm-kpi-l">Note moyenne</div></div>
              <div className="bbadm-kpi"><div className="bbadm-kpi-v">{avisList.length}</div><div className="bbadm-kpi-l">Avis notés</div></div>
              <div className="bbadm-kpi"><div className="bbadm-kpi-v">{nbChat}</div><div className="bbadm-kpi-l">Discussions</div></div>
              <div className="bbadm-kpi"><div className="bbadm-kpi-v">{connections.length}</div><div className="bbadm-kpi-l">Visites</div></div>
              <div className="bbadm-kpi"><div className="bbadm-kpi-v">{uniqueIps}</div><div className="bbadm-kpi-l">Visiteurs uniques</div></div>
            </div>

            <div className="bbadm-analyse-grid">
              <div className="bbadm-card2">
                <div className="bbadm-chart-title">Répartition des notes</div>
                {ratings.length === 0 && <p className="bbadm-muted">Aucune note.</p>}
                {ratingDist.map((x) => (
                  <div className="bbadm-rrow" key={x.n}>
                    <span className="bbadm-rstar">{x.n}★</span>
                    <div className="bbadm-rbar"><div style={{ width: `${(x.c / maxRating) * 100}%` }} /></div>
                    <span className="bbadm-rc">{x.c}</span>
                  </div>
                ))}
              </div>

              <div className="bbadm-card2">
                <div className="bbadm-chart-title">Pages les plus visitées</div>
                {topPages.length === 0 && <p className="bbadm-muted">Aucune visite.</p>}
                <table className="bbadm-table compact">
                  <tbody>
                    {topPages.map(([p, n]) => (
                      <tr key={p}>
                        <td className="bbadm-mono">{p}</td>
                        <td className="bbadm-minibar"><div style={{ width: `${(n / maxPage) * 100}%` }} /></td>
                        <td className="bbadm-num">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bbadm-card2">
                <div className="bbadm-chart-title">Navigateurs</div>
                <table className="bbadm-table compact"><tbody>
                  {byBrowser.length === 0 && <tr><td className="bbadm-muted">—</td></tr>}
                  {byBrowser.map(([b, n]) => (<tr key={b}><td>{b}</td><td className="bbadm-num">{n}</td></tr>))}
                </tbody></table>
                <div className="bbadm-chart-title" style={{ marginTop: 14 }}>Systèmes</div>
                <table className="bbadm-table compact"><tbody>
                  {byOS.map(([o, n]) => (<tr key={o}><td>{o}</td><td className="bbadm-num">{n}</td></tr>))}
                </tbody></table>
              </div>

              <div className="bbadm-card2">
                <div className="bbadm-chart-title">Lieux</div>
                {topLieux.length === 0 && <p className="bbadm-muted">Aucun lieu.</p>}
                <table className="bbadm-table compact"><tbody>
                  {topLieux.map(([l, n]) => (<tr key={l}><td>{l}</td><td className="bbadm-num">{n}</td></tr>))}
                </tbody></table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = `
.bbadm{min-height:100vh;background:#0a0612;color:#f5f6ff;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",system-ui,sans-serif}
.bbadm *{box-sizing:border-box}
.bbadm-muted{color:rgba(245,246,255,.6);font-size:14px}
.bbadm-err{color:#ff8585;font-size:14px;margin:10px 0}
.bbadm-input{width:100%;padding:14px 16px;margin:14px 0;color:#f5f6ff;font:inherit;font-size:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.2);border-radius:14px;outline:none}
.bbadm-input:focus{border-color:rgba(255,255,255,.5)}
.bbadm-btn{width:100%;padding:14px;font:inherit;font-size:16px;font-weight:600;color:#fff;cursor:pointer;border:none;border-radius:14px;background:linear-gradient(180deg,#7c3aed,#ec4899)}
.bbadm-btn:disabled{opacity:.5;cursor:not-allowed}
.bbadm-gate{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.bbadm-gatecard{max-width:380px;width:100%}
.bbadm-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:26px}
.bbadm-card h1{font-size:22px;margin:0 0 4px}
.bbadm-wrap{max-width:900px;margin:0 auto;padding:26px 18px 60px}
.bbadm-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}
.bbadm-head h1{font-size:26px;margin:0;letter-spacing:-.02em}
.bbadm-actions{display:flex;gap:8px}
.bbadm-mini{padding:9px 13px;font:inherit;font-size:13px;color:#fff;cursor:pointer;border-radius:11px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08)}
.bbadm-mini.ghost{background:none;opacity:.7}
.bbadm-mini.danger{border-color:rgba(255,120,120,.4);color:#ff9d9d;background:rgba(255,120,120,.1)}
.bbadm-mini:hover{filter:brightness(1.25)}
.bbadm-mini:disabled{opacity:.4;cursor:not-allowed}
.bbadm-tabs{display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap}
.bbadm-tab{padding:10px 14px;font:inherit;font-size:14.5px;color:rgba(245,246,255,.6);cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-1px}
.bbadm-tab.on{color:#fff;border-bottom-color:#ec4899;font-weight:600}
.bbadm-tab:hover{color:#fff}
.bbadm-bar{display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.bbadm-spacer{flex:1}
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
.bbadm-chart{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:16px;margin-bottom:16px}
.bbadm-chart-title{font-size:13px;color:rgba(245,246,255,.6);margin-bottom:12px}
.bbadm-bars{display:flex;align-items:flex-end;gap:8px;overflow-x:auto;min-height:120px}
.bbadm-barcol{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:30px}
.bbadm-barval{font-size:11px;color:rgba(245,246,255,.6)}
.bbadm-barfill{width:22px;border-radius:6px 6px 0 0;background:linear-gradient(180deg,#7c3aed,#ec4899)}
.bbadm-barlbl{font-size:10px;color:rgba(245,246,255,.4);white-space:nowrap}
.bbadm-tablewrap{overflow-x:auto;border:1px solid rgba(255,255,255,.12);border-radius:14px}
.bbadm-table{width:100%;border-collapse:collapse;font-size:14px}
.bbadm-table th{text-align:left;padding:11px 14px;background:rgba(255,255,255,.06);color:rgba(245,246,255,.7);font-weight:600;font-size:12.5px;text-transform:uppercase;letter-spacing:.03em}
.bbadm-table td{padding:11px 14px;border-top:1px solid rgba(255,255,255,.08);color:rgba(245,246,255,.9)}
.bbadm-table tr:hover td{background:rgba(255,255,255,.03)}
.bbadm-table.compact td{padding:8px 10px;border-top:1px solid rgba(255,255,255,.06)}
.bbadm-td-date{white-space:nowrap;color:rgba(245,246,255,.6)}
.bbadm-mono{font-family:ui-monospace,Menlo,monospace;font-size:13px}
.bbadm-x{margin-left:6px;font-size:11px;color:#ff9d9d}
.bbadm-num{text-align:right;font-weight:600;width:50px;color:#fff}
.bbadm-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px}
.bbadm-kpi{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;text-align:center}
.bbadm-kpi-v{font-size:28px;font-weight:700;background:linear-gradient(90deg,#c9a8ff,#ec4899);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.bbadm-kpi-l{font-size:12px;color:rgba(245,246,255,.6);margin-top:2px}
.bbadm-analyse-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.bbadm-card2{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:16px}
.bbadm-rrow{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.bbadm-rstar{width:30px;font-size:13px;color:#ffd54a}
.bbadm-rbar{flex:1;height:12px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden}
.bbadm-rbar>div{height:100%;background:linear-gradient(90deg,#ffd54a,#ec4899);border-radius:99px}
.bbadm-rc{width:30px;text-align:right;font-size:13px;color:rgba(245,246,255,.8)}
.bbadm-minibar{width:45%}
.bbadm-minibar>div{height:8px;background:linear-gradient(90deg,#7c3aed,#ec4899);border-radius:99px}
`
