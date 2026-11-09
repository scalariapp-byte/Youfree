import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Player } from '../components/Player'
import { VideoCard, toStored } from '../components/VideoCard'
import { ErrorBox } from '../components/ErrorBox'
import { useAsync } from '../lib/useAsync'
import { getChannel, getComments, getPlaylistVideos, getVideos } from '../lib/youtube'
import { compact, ago, decode } from '../lib/format'
import { getHistory, recordWatch, toggleLocalSub, toggleWatchLater, useLocalSubs, useWatchLater } from '../lib/storage'
import { useAllSubs } from '../lib/useSubs'
import { Icon } from '../components/Icon'
import { Avatar } from '../components/Layout'

function Linkified({ text }: { text: string }) {
  // Liens cliquables + horodatages (ex. 12:34) qui relancent la vidéo au bon moment.
  const parts = text.split(/(https?:\/\/[^\s]+|\b\d{1,2}:\d{2}(?::\d{2})?\b)/g)
  const [, setParams] = useSearchParams()
  return (
    <>
      {parts.map((p, i) => {
        if (/^https?:\/\//.test(p))
          return (
            <a key={i} href={p} target="_blank" rel="noreferrer noopener">
              {p}
            </a>
          )
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(p)) {
          const sec = p.split(':').reduce((a, x) => a * 60 + Number(x), 0)
          return (
            <a key={i} href="#" onClick={(e) => (e.preventDefault(), setParams({ t: String(sec) }))}>
              {p}
            </a>
          )
        }
        return p
      })}
    </>
  )
}

export function Watch() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const tParam = params.get('t')
  const start = tParam ? Number(tParam) : getHistory().find((h) => h.id === id)?.position ?? 0
  const [showDesc, setShowDesc] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const later = useWatchLater()
  const localSubs = useLocalSubs()
  const { google } = useAllSubs()

  const video = useAsync(async () => (await getVideos([id]))[0], [id])
  const v = video.data
  const channel = useAsync(() => (v ? getChannel(v.channelId) : Promise.resolve(undefined)), [v?.channelId])
  const more = useAsync(
    () => (v ? getPlaylistVideos('UU' + v.channelId.slice(2), 12).then((r) => r.videos.filter((x) => x.id !== id)) : Promise.resolve([])),
    [v?.channelId, id],
  )
  const comments = useAsync(() => getComments(id), [id])

  useEffect(() => {
    if (v) recordWatch(toStored(v))
    if (v) document.title = `${decode(v.title)} · Youfree`
    return () => {
      document.title = 'Youfree'
    }
  }, [v])

  useEffect(() => {
    window.scrollTo(0, 0)
    setShowDesc(false)
  }, [id])

  if (video.error) return <div className="page"><ErrorBox error={video.error} /></div>

  const ch = channel.data
  const isLocalSub = !!v && localSubs.some((c) => c.id === v.channelId)
  const isGoogleSub = !!v && google.some((c) => c.id === v.channelId)
  const next = more.data?.[0]

  return (
    <div className="watch">
      <div className="watch-main">
        <Player key={`${id}-${tParam ?? ''}`} id={id} start={start} onEnded={() => autoplay && next && nav(`/watch/${next.id}`)} />
        {v && (
          <>
            <h1 className="watch-title">{decode(v.title)}</h1>
            <div className="watch-bar">
              <Link to={`/channel/${v.channelId}`} className="watch-channel">
                <Avatar src={ch?.thumbnail} name={v.channelTitle} size={40} />
                <div>
                  <strong>{v.channelTitle}</strong>
                  {ch && <small>{compact(ch.subscribers)} abonnés</small>}
                </div>
              </Link>
              {isGoogleSub ? (
                <span className="btn ghost" title="Abonnement de ton compte Google">Abonné ✓</span>
              ) : (
                <button
                  className={`btn ${isLocalSub ? 'ghost' : ''}`}
                  onClick={() => toggleLocalSub({ id: v.channelId, title: v.channelTitle, thumbnail: ch?.thumbnail ?? '' })}
                >
                  {isLocalSub ? 'Abonné ✓' : 'S’abonner'}
                </button>
              )}
              <div className="watch-actions">
                {v.likes > 0 && (
                  <span className="pill">
                    <Icon name="like" size={18} /> {compact(v.likes)}
                  </span>
                )}
                <button className="pill" onClick={() => toggleWatchLater(toStored(v))}>
                  <Icon name={later.some((x) => x.id === v.id) ? 'check' : 'clock'} size={18} /> Plus tard
                </button>
                <button className="pill" onClick={() => navigator.clipboard?.writeText(`https://youtu.be/${v.id}`)} title="Copier le lien YouTube">
                  <Icon name="link" size={18} /> Lien
                </button>
              </div>
            </div>
            <div className={`desc ${showDesc ? 'open' : ''}`} onClick={() => setShowDesc(true)}>
              <strong>
                {compact(v.views)} vues · {ago(v.publishedAt)}
              </strong>
              <p>
                <Linkified text={v.description} />
              </p>
              {showDesc ? (
                <button className="link" onClick={(e) => (e.stopPropagation(), setShowDesc(false))}>
                  Moins
                </button>
              ) : (
                <button className="link">Plus</button>
              )}
            </div>
            <section className="comments">
              <h3>Commentaires</h3>
              {comments.data?.length === 0 && <p className="muted">Commentaires désactivés ou absents.</p>}
              {comments.data?.map((c) => (
                <div key={c.id} className="comment">
                  <Avatar src={c.authorAvatar} name={c.author.replace(/^@/, '')} size={36} />
                  <div>
                    <small>
                      <strong>{c.author}</strong> · {ago(c.publishedAt)}
                    </small>
                    <p>{c.text}</p>
                    {c.likes > 0 && (
                      <small className="muted likes">
                        <Icon name="like" size={14} /> {compact(c.likes)}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
      <aside className="watch-side">
        <div className="section-head">
          <h3>Plus de cette chaîne</h3>
          <label className="toggle">
            <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} /> Lecture auto
          </label>
        </div>
        <div className="list">
          {more.data?.map((x) => (
            <VideoCard key={x.id} video={x} />
          ))}
        </div>
      </aside>
    </div>
  )
}
