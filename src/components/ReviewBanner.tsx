import { useEffect, useRef, useState } from 'react'

/**
 * Bannière « Laisse-nous un avis » affichée en fin de quiz.
 * - N'affiche rien si l'élève a déjà donné/refusé son avis (localStorage).
 * - Ouvre une modale : prénom → choix → (⭐ note+avis | 💬 chat IA) → merci.
 * - Envoie les données à /api/review (même domaine). Aucune clé secrète ici.
 * - Les réponses ne sont JAMAIS affichées dans le site : elles partent dans Google Sheets.
 */

const DONE_KEY = 'bb_review_done'
const WEBHOOK = '/api/review'

type Screen = 'banner' | 'choice' | 'stars' | 'chat' | 'thanks'
type Msg = { role: 'user' | 'assistant'; content: string }

async function postReview(payload: unknown): Promise<{ reply?: string; ok?: boolean } | null> {
  try {
    const res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return await res.json()
  } catch {
    return null
  }
}

export default function ReviewBanner() {
  const [hidden, setHidden] = useState(true)
  const [open, setOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('banner')

  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [sending, setSending] = useState(false)

  const [messages, setMessages] = useState<Msg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [typing, setTyping] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const chatSaved = useRef(false)

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(DONE_KEY) === '1')
    } catch {
      setHidden(false)
    }
  }, [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const markDone = () => {
    try {
      localStorage.setItem(DONE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (hidden) return null

  const dismiss = () => {
    markDone()
    setHidden(true)
  }

  const goName = () => {
    if (!name.trim()) return
    setScreen('choice')
  }

  const startChat = async () => {
    setScreen('chat')
    if (messages.length) return
    const seed: Msg[] = [{ role: 'user', content: '[Début] Bonjour, je veux donner mon avis.' }]
    setMessages(seed)
    setTyping(true)
    const data = await postReview({ type: 'chat', name: name.trim(), messages: seed })
    setTyping(false)
    const reply = data?.reply || 'Salut ' + name.trim() + ' ! Qu’as-tu pensé de l’appli ? 😊'
    setMessages((m) => [...m, { role: 'assistant', content: reply }])
  }

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = chatInput.trim()
    if (!t || typing) return
    const next: Msg[] = [...messages, { role: 'user', content: t }]
    setMessages(next)
    setChatInput('')
    setTyping(true)
    const data = await postReview({ type: 'chat', name: name.trim(), messages: next })
    setTyping(false)
    const reply = data?.reply || 'Merci beaucoup pour ton retour ! 🙏'
    setMessages((m) => [...m, { role: 'assistant', content: reply }])
  }

  const sendReview = async () => {
    if (!rating || sending) return
    setSending(true)
    await postReview({ type: 'avis', name: name.trim(), rating, text: review.trim() })
    setSending(false)
    markDone()
    setScreen('thanks')
  }

  // Enregistre TOUTE la conversation en une seule fois (résumé + transcript en note),
  // à la fermeture du chat — pas un envoi par message.
  const saveChatIfNeeded = () => {
    const hasReal = messages.some((m) => m.role === 'user' && !m.content.startsWith('[Début]'))
    if (chatSaved.current || !hasReal) return
    chatSaved.current = true
    markDone()
    void postReview({ type: 'chat_save', name: name.trim(), messages })
  }

  const closeModal = () => {
    saveChatIfNeeded()
    setOpen(false)
    if (screen === 'thanks' || chatSaved.current) setHidden(true)
  }

  return (
    <>
      <style>{styles}</style>

      {/* Encart discret sur l'écran de résultat */}
      <div className="bbrvw-card">
        <div className="bbrvw-card-txt">
          <strong>🌟 Aide-nous à améliorer l’appli</strong>
          <span>Laisse un petit avis, ça prend 20 secondes.</span>
        </div>
        <div className="bbrvw-card-actions">
          <button
            className="bbrvw-btn bbrvw-primary"
            onClick={() => {
              setOpen(true)
              setScreen('banner')
            }}
          >
            Donner mon avis
          </button>
          <button className="bbrvw-ghost" onClick={dismiss}>
            Non merci
          </button>
        </div>
      </div>

      {open && (
        <div className="bbrvw-overlay" role="dialog" aria-modal="true">
          <div className="bbrvw-bg">
            <span className="bbrvw-blob b1" />
            <span className="bbrvw-blob b2" />
            <span className="bbrvw-blob b3" />
          </div>

          <button className="bbrvw-close" onClick={closeModal} aria-label="Fermer">
            ✕
          </button>

          <div className="bbrvw-stage">
            {screen === 'banner' && (
              <div className="bbrvw-glass bbrvw-pad">
                <h2 className="bbrvw-h">🌟 Laisse-nous un avis</h2>
                <p className="bbrvw-muted">Ton retour nous aide à rendre l’appli encore meilleure.</p>
                <input
                  className="bbrvw-input"
                  placeholder="Ton prénom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && goName()}
                  autoFocus
                />
                <button className="bbrvw-btn bbrvw-primary bbrvw-full" onClick={goName}>
                  Continuer
                </button>
              </div>
            )}

            {screen === 'choice' && (
              <div className="bbrvw-glass bbrvw-pad">
                <h2 className="bbrvw-h">Bonjour {name.trim()} !</h2>
                <p className="bbrvw-muted">Comment préfères-tu nous donner ton avis ?</p>
                <button className="bbrvw-btn bbrvw-primary bbrvw-full" onClick={() => setScreen('stars')}>
                  ⭐ Noter &amp; écrire un avis
                </button>
                <button className="bbrvw-btn bbrvw-full" onClick={startChat}>
                  💬 En discuter avec l’assistant
                </button>
              </div>
            )}

            {screen === 'stars' && (
              <div className="bbrvw-glass bbrvw-pad">
                <button className="bbrvw-back" onClick={() => setScreen('choice')}>
                  ← Retour
                </button>
                <h2 className="bbrvw-h">Ta note</h2>
                <p className="bbrvw-muted">Touche les étoiles, puis écris quelques mots.</p>
                <div className="bbrvw-stars">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <span
                      key={v}
                      className={v <= rating ? 'on' : ''}
                      onClick={() => setRating(v)}
                      role="button"
                      aria-label={`${v} étoile${v > 1 ? 's' : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <textarea
                  className="bbrvw-input bbrvw-area"
                  rows={4}
                  placeholder="Qu’as-tu pensé de l’appli ?"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
                <button
                  className="bbrvw-btn bbrvw-primary bbrvw-full"
                  onClick={sendReview}
                  disabled={!rating || sending}
                >
                  {sending ? 'Envoi…' : 'Envoyer mon avis'}
                </button>
              </div>
            )}

            {screen === 'chat' && (
              <div className="bbrvw-glass bbrvw-chatwrap">
                <button className="bbrvw-back" onClick={() => setScreen('choice')}>
                  ← Retour
                </button>
                <div className="bbrvw-chathead">Discutons 💬</div>
                <div className="bbrvw-chat" ref={chatRef}>
                  {messages
                    .filter((m, i) => !(i === 0 && m.role === 'user'))
                    .map((m, i) => (
                      <div key={i} className={'bbrvw-msg ' + (m.role === 'user' ? 'me' : 'bot')}>
                        {m.content}
                      </div>
                    ))}
                  {typing && <div className="bbrvw-msg bot bbrvw-typing">…</div>}
                </div>
                <form className="bbrvw-chatbar" onSubmit={sendChat}>
                  <input
                    className="bbrvw-input"
                    placeholder="Écris ici…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button className="bbrvw-btn bbrvw-primary bbrvw-send" type="submit">
                    ↑
                  </button>
                </form>
              </div>
            )}

            {screen === 'thanks' && (
              <div className="bbrvw-glass bbrvw-pad bbrvw-center">
                <div className="bbrvw-big">🎉</div>
                <h2 className="bbrvw-h">Merci {name.trim()} !</h2>
                <p className="bbrvw-muted">Ton avis a bien été envoyé.</p>
                <button className="bbrvw-btn bbrvw-primary bbrvw-full" onClick={closeModal}>
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const styles = `
.bbrvw-card{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;
  margin:18px 0 4px;padding:16px 18px;border-radius:20px;
  background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(236,72,153,.14));
  border:1px solid rgba(255,255,255,.14)}
.bbrvw-card-txt{display:flex;flex-direction:column;gap:3px}
.bbrvw-card-txt strong{font-size:15px}
.bbrvw-card-txt span{font-size:13px;opacity:.7}
.bbrvw-card-actions{display:flex;gap:10px;align-items:center}
.bbrvw-ghost{background:none;border:none;color:inherit;opacity:.6;font:inherit;font-size:13px;cursor:pointer}
.bbrvw-ghost:hover{opacity:1}

.bbrvw-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
  padding:20px;background:rgba(8,4,20,.72);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  color:#f5f6ff;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',system-ui,sans-serif}
.bbrvw-bg{position:absolute;inset:0;overflow:hidden;z-index:0;filter:blur(70px) saturate(140%);pointer-events:none}
.bbrvw-blob{position:absolute;border-radius:50%;opacity:.6;mix-blend-mode:screen}
.bbrvw-blob.b1{width:50vmin;height:50vmin;left:-6vmin;top:-4vmin;background:radial-gradient(circle,#7c3aed,transparent 70%)}
.bbrvw-blob.b2{width:52vmin;height:52vmin;right:-10vmin;top:10vmin;background:radial-gradient(circle,#ec4899,transparent 70%)}
.bbrvw-blob.b3{width:54vmin;height:54vmin;left:10vmin;bottom:-16vmin;background:radial-gradient(circle,#2dd4bf,transparent 70%)}
.bbrvw-close{position:absolute;top:18px;right:20px;z-index:3;width:40px;height:40px;border-radius:50%;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:16px;cursor:pointer}
.bbrvw-stage{position:relative;z-index:2;width:100%;max-width:420px}
.bbrvw-glass{position:relative;border-radius:28px;overflow:hidden;
  background:rgba(255,255,255,.1);-webkit-backdrop-filter:blur(26px) saturate(190%);backdrop-filter:blur(26px) saturate(190%);
  border:1px solid rgba(255,255,255,.28);
  box-shadow:0 18px 50px rgba(8,4,20,.45),inset 0 1.5px 0 rgba(255,255,255,.5)}
.bbrvw-pad{padding:26px}
.bbrvw-center{text-align:center}
.bbrvw-h{font-size:24px;font-weight:700;letter-spacing:-.02em;margin:0 0 6px}
.bbrvw-muted{color:rgba(245,246,255,.62);font-size:14.5px;line-height:1.5;margin:0 0 20px}
.bbrvw-input{width:100%;box-sizing:border-box;padding:15px 17px;color:#f5f6ff;font:inherit;font-size:16px;
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:16px;outline:none}
.bbrvw-input::placeholder{color:rgba(245,246,255,.5)}
.bbrvw-input:focus{border-color:rgba(255,255,255,.55);background:rgba(255,255,255,.14)}
.bbrvw-area{resize:none;margin-top:2px}
.bbrvw-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:15px;margin-top:12px;
  font:inherit;font-size:16px;font-weight:600;color:#fff;cursor:pointer;border-radius:18px;
  border:1px solid rgba(255,255,255,.3);background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,.08))}
.bbrvw-btn:hover{transform:translateY(-1px)}
.bbrvw-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.bbrvw-full{width:100%}
.bbrvw-primary{border-color:rgba(255,255,255,.42);background:linear-gradient(180deg,rgba(124,58,237,.9),rgba(236,72,153,.82))}
.bbrvw-back{background:none;border:none;color:rgba(245,246,255,.62);cursor:pointer;font-size:14px;padding:0;margin-bottom:14px}
.bbrvw-back:hover{color:#fff}
.bbrvw-stars{display:flex;gap:10px;justify-content:center;margin:10px 0 18px}
.bbrvw-stars span{font-size:40px;line-height:1;cursor:pointer;color:rgba(255,255,255,.3);user-select:none;transition:.15s}
.bbrvw-stars span.on{color:#ffd54a;transform:scale(1.1);text-shadow:0 0 14px rgba(255,213,74,.7)}
.bbrvw-chatwrap{display:flex;flex-direction:column;padding:18px;gap:12px;height:min(70vh,520px)}
.bbrvw-chathead{font-size:19px;font-weight:700}
.bbrvw-chat{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:9px;padding:2px}
.bbrvw-msg{max-width:84%;padding:11px 14px;font-size:15px;line-height:1.45;white-space:pre-wrap;border:1px solid rgba(255,255,255,.18)}
.bbrvw-msg.bot{align-self:flex-start;background:rgba(255,255,255,.12);border-radius:18px 18px 18px 6px}
.bbrvw-msg.me{align-self:flex-end;border-radius:18px 18px 6px 18px;border-color:rgba(255,255,255,.3);
  background:linear-gradient(180deg,rgba(124,58,237,.85),rgba(236,72,153,.7))}
.bbrvw-typing{font-style:italic;opacity:.7}
.bbrvw-chatbar{display:flex;gap:10px;align-items:center}
.bbrvw-chatbar .bbrvw-input{flex:1}
.bbrvw-send{flex:0 0 48px;width:48px;height:48px;margin:0;padding:0;border-radius:50%;font-size:19px}
.bbrvw-big{font-size:60px}
`
