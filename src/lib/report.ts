// Rapport à m'envoyer : version, appareil, réglages utiles et journal récent.
import { getLog } from './log'
import { getSettings } from './storage'
import { systemShare } from './share'

export function buildReport() {
  const s = getSettings()
  return [
    `Youtmusic version ${import.meta.env.VITE_BUILD ?? 'dev'} · ${new Date().toLocaleString('fr-FR')}`,
    `Appareil : ${navigator.userAgent}`,
    `Lecteur=${s.player} qualité=${s.quality} langue=${s.lang} région=${s.region} langue stricte=${s.strictLang} audio=${localStorage.getItem('youfree:audioBlob') === '1' ? 'blob' : 'direct'} client=${localStorage.getItem('youfree:client') ?? '?'}`,
    `Accueil=${s.homeOrder.join(',')} sections=${Object.entries(s.sections).filter(([, v]) => v).map(([k]) => k).join(',')} onglets=${s.tabs.join(',')}`,
    '--- Journal ---',
    ...getLog().slice(-150),
  ].join('\n')
}

export const sendReport = () => systemShare(buildReport(), 'Rapport Youtmusic')
export const copyReport = () => navigator.clipboard?.writeText(buildReport())
