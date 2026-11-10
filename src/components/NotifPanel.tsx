import { askPermission } from '../lib/notify'
import { saveSettings, useLocalSubs, useSettings } from '../lib/storage'
import { Avatar } from './Layout'

/** Notifications : interrupteur général + une ligne par chaîne. */
export function NotifPanel() {
  const s = useSettings()
  const subs = useLocalSubs()
  const all = s.notificationsOn
  return (
    <div className="pane">
      <div className="pref big">
        <span>
          <strong>Notifications</strong>
          <small>{all ? 'Activées' : 'Toutes désactivées'}</small>
        </span>
        <button
          className={`switch ${all ? 'on' : ''}`}
          aria-label="Toutes les notifications"
          onClick={async () => {
            if (!all) await askPermission()
            saveSettings({ notificationsOn: !all })
          }}
        />
      </div>
      {all && (
        <>
          <p className="muted">Choisis les chaînes qui te préviennent quand elles publient une vidéo.</p>
          {subs.length === 0 && <p className="muted">Abonne-toi d’abord à des chaînes.</p>}
          {subs.map((c) => {
            const on = s.notifyChannels.includes(c.id)
            return (
              <div key={c.id} className="pref">
                <span className="pref-chan">
                  <Avatar src={c.thumbnail} name={c.title} size={32} />
                  <strong>{c.title}</strong>
                </span>
                <button
                  className={`switch ${on ? 'on' : ''}`}
                  aria-label={c.title}
                  onClick={async () => {
                    if (!on) await askPermission()
                    saveSettings({ notifyChannels: on ? s.notifyChannels.filter((x) => x !== c.id) : [...s.notifyChannels, c.id] })
                  }}
                />
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
