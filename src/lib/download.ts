// Téléchargement : le plugin natif télécharge vidéo + audio puis les assemble (MediaMuxer)
// dans le dossier Téléchargements du téléphone.
import { registerPlugin } from '@capacitor/core'
import { downloadOptions, getStreams } from './stream'

interface DownloaderPlugin {
  download(o: { video: string; audio: string; title: string; ext: string }): Promise<{ path: string }>
  addListener(e: 'progress', f: (p: { percent: number; step: string }) => void): Promise<{ remove: () => void }>
}
const Downloader = registerPlugin<DownloaderPlugin>('YoutmusicDownloader')

export async function listQualities(id: string) {
  return downloadOptions(await getStreams(id))
}

export async function download(id: string, title: string, height: number, onProgress: (p: number, step: string) => void) {
  const opt = (await listQualities(id)).find((o) => o.height === height)
  if (!opt) throw new Error('Qualité indisponible')
  const sub = await Downloader.addListener('progress', (p) => onProgress(p.percent, p.step))
  try {
    return await Downloader.download({ video: opt.video.url, audio: opt.audio!.url, title: `${title} (${height}p)`, ext: opt.ext })
  } finally {
    sub.remove()
  }
}
