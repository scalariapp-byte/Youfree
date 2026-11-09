// Partage avec le sélecteur d'applis d'Android (WhatsApp, Messages, Snapchat…).
import { isNative } from './nativeFetch'

export async function shareVideo(id: string, title: string, short = false) {
  const url = short ? `https://youtube.com/shorts/${id}` : `https://youtu.be/${id}`
  try {
    if (isNative()) {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title, text: title, url, dialogTitle: 'Partager avec…' })
    } else if (navigator.share) await navigator.share({ title, url })
    else await navigator.clipboard?.writeText(url)
  } catch {
    /* partage annulé */
  }
}
