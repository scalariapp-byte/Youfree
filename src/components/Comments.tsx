import { useEffect, useState } from 'react'
import type { Comment } from '../lib/youtube'
import { useSettings } from '../lib/storage'
import { translateAll } from '../lib/translate'
import { ago, compact } from '../lib/format'
import { Avatar } from './Layout'
import { Icon } from './Icon'

/** Commentaires traduits automatiquement dans la langue choisie, avec accès à l'original. */
export function Comments({ list }: { list: Comment[] }) {
  const { lang } = useSettings()
  const [tr, setTr] = useState<string[] | null>(null)
  const [original, setOriginal] = useState(false)
  useEffect(() => {
    let ok = true
    setTr(null)
    translateAll(
      list.map((c) => c.text),
      lang,
    ).then((t) => ok && setTr(t))
    return () => {
      ok = false
    }
  }, [list, lang])
  if (!list.length) return <p className="muted">Commentaires désactivés ou absents.</p>
  return (
    <div className="comments-list">
      <button className="link small" onClick={() => setOriginal(!original)}>
        {original ? 'Afficher la traduction' : tr ? 'Traduit automatiquement · voir l’original' : 'Traduction…'}
      </button>
      {list.map((c, i) => (
        <div key={c.id} className="comment">
          <Avatar src={c.authorAvatar} name={c.author.replace(/^@/, '')} size={34} />
          <div>
            <small>
              <strong>{c.author}</strong>
              {c.publishedAt && <span className="muted"> · {ago(c.publishedAt)}</span>}
            </small>
            <p>{!original && tr ? tr[i] : c.text}</p>
            {c.likes > 0 && (
              <small className="muted likes">
                <Icon name="like" size={14} /> {compact(c.likes)}
              </small>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
