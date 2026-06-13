import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getSubject, getChapter } from '../data'
import { findChapterForQuery, type ChapterMatch } from '../utils/chapterSearch'

/**
 * « Coach Phifou » — assistant IA flottant présent sur toutes les pages.
 * - Bulle en bas à droite ; clic → panneau de discussion.
 * - Sait sur quelle page se trouve l'élève (matière / chapitre) et le transmet
 *   à l'IA comme contexte, pour des réponses pertinentes.
 * - Parle à /api/tutor (même domaine → DeepSeek direct, ou n8n si configuré).
 * - Historique gardé en localStorage (survit aux navigations et aux reloads).
 * - Masqué sur la page /admin.
 */

const HISTORY_KEY = 'bb_tutor_history'
const ENDPOINT = '/api/tutor'

type Msg = { role: 'user' | 'assistant'; content: string; nav?: ChapterMatch }

// Décrit la page courante en une phrase, pour guider l'IA.
function describeContext(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  const [section, subjectId, chapterId] = parts

  const subjectLabel = (id?: string) => (id ? getSubject(id)?.label : undefined)
  const chapterTitle = (s?: string, c?: string) =>
    s && c ? getChapter(s, c)?.chapter.title : undefined

  switch (section) {
    case undefined:
      return "L'élève est sur l'accueil de l'appli."
    case 'subject':
      return `L'élève parcourt la matière « ${subjectLabel(subjectId) || subjectId} » (liste des chapitres).`
    case 'quiz': {
      const t = chapterTitle(subjectId, chapterId)
      return `L'élève fait un QUIZ de « ${subjectLabel(subjectId) || subjectId} »${t ? `, chapitre « ${t} »` : ''}. Il peut bloquer sur une question.`
    }
    case 'flashcards': {
      const t = chapterTitle(subjectId, chapterId)
      return `L'élève révise en FLASHCARDS « ${subjectLabel(subjectId) || subjectId} »${t ? `, chapitre « ${t} »` : ''}.`
    }
    case 'lesson': {
      const t = chapterTitle(subjectId, chapterId)
      return `L'élève lit le COURS de « ${subjectLabel(subjectId) || subjectId} »${t ? `, chapitre « ${t} »` : ''}.`
    }
    case 'culture-g':
      return "L'élève est dans la section Culture Générale."
    case 'revision':
      return "L'élève est dans le mode « Mes erreurs » (il rejoue ses questions ratées)."
    case 'exam':
      return "L'élève passe un examen blanc."
    case 'stats':
      return "L'élève regarde ses statistiques de progression."
    default:
      return "L'élève utilise l'appli BrevetBoost."
  }
}

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(-40) : []
  } catch {
    return []
  }
}

// Rendu « markdown léger » et SÛR des réponses de l'IA (DeepSeek émet parfois
// du **gras**, des listes, du `code`). On construit des nœuds React — JAMAIS de
// HTML brut injecté — donc aucun risque de XSS : tout texte reste échappé.
function renderInline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[2] != null) out.push(<strong key={`${key}-b${i}`}>{m[2]}</strong>)
    else if (m[3] != null) out.push(<code key={`${key}-c${i}`} className="bbai-code">{m[3]}</code>)
    else if (m[4] != null) out.push(<em key={`${key}-i${i}`}>{m[4]}</em>)
    last = m.index + m[0].length
    i++
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function renderRich(content: string): ReactNode {
  return content.split('\n').map((line, i) => (
    <span key={i} className="bbai-line">
      {renderInline(line, `l${i}`)}
    </span>
  ))
}

export default function TutorAssistant() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>(loadHistory)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Persiste l'historique.
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-40)))
    } catch {
      /* ignore */
    }
  }, [messages])

  // Auto-scroll en bas à chaque nouveau message.
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing, open])

  // Focus l'input à l'ouverture.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  // Masqué sur la page admin.
  if (location.pathname.startsWith('/admin')) return null

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || typing) return
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setTyping(true)
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tutor',
          context: describeContext(location.pathname),
          // On envoie un historique borné pour limiter les tokens.
          messages: next.slice(-12),
        }),
      })
      const data = res.ok ? await res.json() : null
      const reply = data?.reply || "Oups, je n'ai pas pu répondre. Réessaie dans un instant 🙏"
      // Détecte (côté client, 0 token) si la question vise un chapitre précis,
      // pour proposer un raccourci « Réviser ce chapitre ».
      const nav = findChapterForQuery(text) || undefined
      setMessages((m) => [...m, { role: 'assistant', content: reply, nav }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: "Connexion impossible. Vérifie ta connexion et réessaie 🙏" }])
    } finally {
      setTyping(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {
      /* ignore */
    }
  }

  // Redirige vers la matière + chapitre suggéré et ferme le panneau pour voir la
  // page (la carte du chapitre s'illumine à l'arrivée — cf. ?focus= côté SubjectPage).
  const goToChapter = (nav: ChapterMatch) => {
    setOpen(false)
    navigate(`/subject/${nav.subjectId}?focus=${nav.chapterId}`)
  }

  return (
    <>
      <style>{styles}</style>

      {/* Bulle flottante */}
      {!open && (
        <button className="bbai-fab" onClick={() => setOpen(true)} aria-label="Ouvrir l'assistant Coach Phifou">
          <span className="bbai-fab-ico">🎓</span>
          <span className="bbai-fab-pulse" />
        </button>
      )}

      {/* Panneau de discussion */}
      {open && (
        <div className="bbai-panel" role="dialog" aria-modal="false" aria-label="Assistant Coach Phifou">
          <div className="bbai-head">
            <div className="bbai-head-id">
              <span className="bbai-avatar">🎓</span>
              <div className="bbai-head-txt">
                <strong>Coach <span className="bbai-name">Phifou</span></strong>
                <span>Ton assistant brevet · IA</span>
              </div>
            </div>
            <div className="bbai-head-actions">
              {messages.length > 0 && (
                <button className="bbai-icobtn" onClick={clearChat} title="Effacer la conversation" aria-label="Effacer">
                  🗑
                </button>
              )}
              <button className="bbai-icobtn" onClick={() => setOpen(false)} title="Réduire" aria-label="Fermer">
                ✕
              </button>
            </div>
          </div>

          <div className="bbai-chat" ref={chatRef}>
            {messages.length === 0 && (
              <div className="bbai-welcome">
                <div className="bbai-welcome-big">👋</div>
                <p className="bbai-welcome-h">Salut ! Je suis Coach <span className="bbai-name">Phifou</span>.</p>
                <p className="bbai-welcome-p">
                  Une question de cours, un exercice qui bloque, une méthode à réviser&nbsp;? Demande-moi tout, je suis là
                  pour t'aider à décrocher ton brevet 💪
                </p>
                <div className="bbai-chips">
                  {[
                    'Explique-moi le théorème de Pythagore',
                    'Comment réussir le sujet de rédaction ?',
                    'Donne-moi 3 dates clés en histoire',
                  ].map((q) => (
                    <button key={q} className="bbai-chip" onClick={() => setInput(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <Fragment key={i}>
                <div className={'bbai-msg ' + (m.role === 'user' ? 'me' : 'bot')}>
                  {m.role === 'user' ? m.content : renderRich(m.content)}
                </div>
                {m.nav && (
                  <button className="bbai-nav" onClick={() => m.nav && goToChapter(m.nav)}>
                    <span className="bbai-nav-ico">{m.nav.subjectEmoji}</span>
                    <span className="bbai-nav-txt">
                      Réviser « {m.nav.chapterTitle} »
                      <small>{m.nav.subjectLabel}</small>
                    </span>
                    <span className="bbai-nav-arrow">→</span>
                  </button>
                )}
              </Fragment>
            ))}
            {typing && (
              <div className="bbai-msg bot bbai-typing">
                <span /> <span /> <span />
              </div>
            )}
          </div>

          <form className="bbai-bar" onSubmit={send}>
            <input
              ref={inputRef}
              className="bbai-input"
              placeholder="Pose ta question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
            />
            <button className="bbai-send" type="submit" disabled={typing || !input.trim()} aria-label="Envoyer">
              ↑
            </button>
          </form>
        </div>
      )}
    </>
  )
}

const styles = `
.bbai-fab{position:fixed;z-index:9000;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));
  width:60px;height:60px;border-radius:50%;border:1px solid rgba(255,255,255,.35);cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;
  box-shadow:0 10px 28px rgba(124,58,237,.5);transition:transform .18s,box-shadow .18s}
.bbai-fab:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 14px 34px rgba(236,72,153,.55)}
.bbai-fab:active{transform:scale(.94)}
.bbai-fab-ico{font-size:27px;line-height:1}
.bbai-fab-pulse{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(45,212,191,.7);
  animation:bbai-ping 2.4s ease-out infinite;pointer-events:none}
@keyframes bbai-ping{0%{transform:scale(1);opacity:.7}70%,100%{transform:scale(1.5);opacity:0}}

.bbai-panel{position:fixed;z-index:9001;display:flex;flex-direction:column;overflow:hidden;
  right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));
  width:min(380px,calc(100vw - 28px));height:min(580px,calc(100vh - 90px));
  border-radius:24px;border:1px solid rgba(255,255,255,.22);
  color:#f5f6ff;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',system-ui,sans-serif;
  background:linear-gradient(170deg,rgba(30,18,56,.97),rgba(16,10,34,.98));
  -webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);
  box-shadow:0 24px 60px rgba(8,4,20,.6);animation:bbai-pop .22s cubic-bezier(.2,.9,.3,1.2)}
@keyframes bbai-pop{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}

.bbai-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;
  border-bottom:1px solid rgba(255,255,255,.12);
  background:linear-gradient(120deg,rgba(124,58,237,.32),rgba(236,72,153,.22))}
.bbai-head-id{display:flex;align-items:center;gap:11px;min-width:0}
.bbai-avatar{width:40px;height:40px;flex:0 0 40px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:21px;background:linear-gradient(135deg,#2dd4bf,#7c3aed);box-shadow:0 4px 12px rgba(0,0,0,.3)}
.bbai-head-txt{display:flex;flex-direction:column;min-width:0}
.bbai-head-txt strong{font-size:15.5px;letter-spacing:-.01em}
.bbai-name{background:linear-gradient(90deg,#fbbf24,#f472b6,#a78bfa,#22d3ee);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;font-weight:800;font-size:1.32em;letter-spacing:.3px;animation:bbai-namehue 6s linear infinite}
@keyframes bbai-namehue{to{background-position:200% center}}
@media (prefers-reduced-motion:reduce){.bbai-name{animation:none}}
.bbai-head-txt span{font-size:11.5px;opacity:.66}
.bbai-head-actions{display:flex;gap:6px}
.bbai-icobtn{width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.18);cursor:pointer;
  background:rgba(255,255,255,.08);color:#fff;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;
  transition:background .15s}
.bbai-icobtn:hover{background:rgba(255,255,255,.2)}

.bbai-chat{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:9px;padding:14px}
.bbai-msg{max-width:86%;padding:11px 14px;font-size:14.5px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;
  border:1px solid rgba(255,255,255,.14)}
.bbai-msg.bot{align-self:flex-start;background:rgba(255,255,255,.09);border-radius:16px 16px 16px 5px}
.bbai-msg.me{align-self:flex-end;border-radius:16px 16px 5px 16px;border-color:rgba(255,255,255,.28);
  background:linear-gradient(180deg,rgba(124,58,237,.88),rgba(236,72,153,.72))}
.bbai-line{display:block}
.bbai-line:empty{height:.5em}
.bbai-code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.92em;background:rgba(255,255,255,.16);padding:1px 5px;border-radius:5px}
.bbai-msg.bot strong{font-weight:700}
.bbai-typing{display:flex;gap:4px;align-items:center}
.bbai-typing span{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.6);animation:bbai-blink 1.2s infinite}
.bbai-typing span:nth-child(2){animation-delay:.2s}
.bbai-typing span:nth-child(3){animation-delay:.4s}
@keyframes bbai-blink{0%,60%,100%{opacity:.25}30%{opacity:1}}

/* Bouton « Réviser ce chapitre » sous une réponse — animé pour attirer l'œil */
.bbai-nav{align-self:flex-start;max-width:90%;display:flex;align-items:center;gap:10px;margin:-2px 0 2px;
  padding:10px 13px;border-radius:14px;cursor:pointer;color:#f5f6ff;font:inherit;text-align:left;
  border:1px solid rgba(94,234,212,.55);
  background:linear-gradient(120deg,rgba(45,212,191,.22),rgba(124,58,237,.30));
  animation:bbai-navpulse 2s ease-in-out infinite}
.bbai-nav:hover{transform:translateY(-1px);border-color:rgba(94,234,212,.95);background:linear-gradient(120deg,rgba(45,212,191,.32),rgba(124,58,237,.42))}
.bbai-nav:active{transform:translateY(0) scale(.99)}
.bbai-nav-ico{font-size:18px;flex:0 0 auto;line-height:1}
.bbai-nav-txt{display:flex;flex-direction:column;line-height:1.25;font-size:13.5px;font-weight:600}
.bbai-nav-txt small{font-weight:500;opacity:.68;font-size:11px;margin-top:1px}
.bbai-nav-arrow{margin-left:auto;font-size:17px;animation:bbai-navarrow 1.3s ease-in-out infinite}
@keyframes bbai-navpulse{0%,100%{box-shadow:0 0 0 0 rgba(94,234,212,0)}50%{box-shadow:0 0 0 4px rgba(94,234,212,.16)}}
@keyframes bbai-navarrow{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
@media (prefers-reduced-motion:reduce){.bbai-nav,.bbai-nav-arrow{animation:none}}

.bbai-welcome{margin:auto 0;text-align:center;padding:8px 6px}
.bbai-welcome-big{font-size:42px;margin-bottom:6px}
.bbai-welcome-h{font-size:17px;font-weight:700;margin:0 0 6px}
.bbai-welcome-p{font-size:13.5px;line-height:1.55;color:rgba(245,246,255,.66);margin:0 0 16px}
.bbai-chips{display:flex;flex-direction:column;gap:8px}
.bbai-chip{text-align:left;padding:10px 13px;font:inherit;font-size:13px;color:#f5f6ff;cursor:pointer;
  border-radius:13px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);transition:.15s}
.bbai-chip:hover{background:rgba(255,255,255,.14);border-color:rgba(45,212,191,.5);transform:translateY(-1px)}

.bbai-bar{display:flex;gap:9px;align-items:center;padding:12px;border-top:1px solid rgba(255,255,255,.12)}
.bbai-input{flex:1;box-sizing:border-box;padding:13px 15px;color:#f5f6ff;font:inherit;font-size:16px;
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:14px;outline:none}
.bbai-input::placeholder{color:rgba(245,246,255,.45)}
.bbai-input:focus{border-color:rgba(45,212,191,.55);background:rgba(255,255,255,.13)}
.bbai-send{flex:0 0 46px;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.3);cursor:pointer;
  font-size:18px;color:#fff;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,#7c3aed,#ec4899);transition:.15s}
.bbai-send:hover:not(:disabled){transform:translateY(-1px)}
.bbai-send:disabled{opacity:.4;cursor:not-allowed}

@media (max-width:480px){
  .bbai-panel{width:calc(100vw - 16px);height:calc(100vh - 80px);right:8px;bottom:8px;border-radius:20px}
}
@media (prefers-reduced-motion:reduce){
  .bbai-fab-pulse,.bbai-panel{animation:none}
}
`
