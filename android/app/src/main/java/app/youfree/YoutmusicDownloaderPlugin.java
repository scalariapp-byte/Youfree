package app.youfree;

import android.content.ContentValues;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.ByteBuffer;

/** Télécharge les flux vidéo et audio, les assemble sans réencodage et enregistre dans Téléchargements. */
@CapacitorPlugin(name = "YoutmusicDownloader")
public class YoutmusicDownloaderPlugin extends Plugin {

    @PluginMethod
    public void download(PluginCall call) {
        String video = call.getString("video"), audio = call.getString("audio");
        String ext = call.getString("ext", "mp4");
        String title = call.getString("title", "video").replaceAll("[\\\\/:*?\"<>|]", "_");
        new Thread(() -> {
            File v = new File(getContext().getCacheDir(), "dl_v"), a = new File(getContext().getCacheDir(), "dl_a");
            File out = new File(getContext().getCacheDir(), "dl_out." + ext);
            try {
                fetch(video, v, 0, 80);
                fetch(audio, a, 80, 95);
                progress(96, "Assemblage");
                mux(v, a, out, ext.equals("webm") ? MediaMuxer.OutputFormat.MUXER_OUTPUT_WEBM : MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
                String path = save(out, title + "." + ext, ext.equals("webm") ? "video/webm" : "video/mp4");
                progress(100, "Terminé");
                JSObject r = new JSObject();
                r.put("path", path);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Téléchargement impossible : " + e.getMessage());
            } finally {
                v.delete();
                a.delete();
                out.delete();
            }
        }).start();
    }

    /** Enregistre un texte (export des données) dans Téléchargements/Youtmusic. */
    @PluginMethod
    public void saveText(PluginCall call) {
        try {
            File tmp = new File(getContext().getCacheDir(), "export.json");
            try (OutputStream os = new FileOutputStream(tmp)) {
                os.write(call.getString("text", "").getBytes("UTF-8"));
            }
            String path = save(tmp, call.getString("name", "youtmusic.json"), "application/json");
            tmp.delete();
            JSObject r = new JSObject();
            r.put("path", path);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("Export impossible : " + e.getMessage());
        }
    }

    private void progress(int p, String step) {
        JSObject o = new JSObject();
        o.put("percent", p);
        o.put("step", step);
        notifyListeners("progress", o);
    }

    /** Téléchargement par morceaux de 8 Mo (les serveurs vidéo limitent les requêtes trop longues). */
    private void fetch(String url, File dest, int from, int to) throws Exception {
        long total = -1, done = 0, chunk = 8L << 20;
        try (OutputStream os = new FileOutputStream(dest)) {
            while (total < 0 || done < total) {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setRequestProperty("Range", "bytes=" + done + "-" + (done + chunk - 1));
                c.setConnectTimeout(15000);
                c.setReadTimeout(30000);
                int code = c.getResponseCode();
                if (code >= 400) throw new Exception("HTTP " + code);
                String cr = c.getHeaderField("Content-Range");
                if (cr != null && cr.contains("/")) total = Long.parseLong(cr.substring(cr.indexOf('/') + 1).trim());
                else if (total < 0) total = c.getContentLengthLong();
                try (InputStream is = c.getInputStream()) {
                    byte[] buf = new byte[1 << 16];
                    int n;
                    while ((n = is.read(buf)) > 0) {
                        os.write(buf, 0, n);
                        done += n;
                    }
                }
                c.disconnect();
                if (total > 0) progress((int) (from + (to - from) * done / total), "Téléchargement");
                if (code == 200) break; // serveur sans prise en charge des plages : tout est reçu
            }
        }
    }

    private void mux(File v, File a, File out, int format) throws Exception {
        MediaMuxer muxer = new MediaMuxer(out.getAbsolutePath(), format);
        MediaExtractor ev = new MediaExtractor(), ea = new MediaExtractor();
        ev.setDataSource(v.getAbsolutePath());
        ea.setDataSource(a.getAbsolutePath());
        ev.selectTrack(0);
        ea.selectTrack(0);
        int tv = muxer.addTrack(ev.getTrackFormat(0)), ta = muxer.addTrack(ea.getTrackFormat(0));
        muxer.start();
        copy(ev, muxer, tv);
        copy(ea, muxer, ta);
        muxer.stop();
        muxer.release();
        ev.release();
        ea.release();
    }

    private void copy(MediaExtractor ex, MediaMuxer m, int track) {
        ByteBuffer buf = ByteBuffer.allocate(4 << 20);
        MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
        while (true) {
            int size = ex.readSampleData(buf, 0);
            if (size < 0) break;
            info.set(0, size, ex.getSampleTime(), (ex.getSampleFlags() & MediaExtractor.SAMPLE_FLAG_SYNC) != 0 ? MediaCodec.BUFFER_FLAG_KEY_FRAME : 0);
            m.writeSampleData(track, buf, info);
            ex.advance();
        }
    }

    private String save(File src, String name, String mime) throws Exception {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentValues cv = new ContentValues();
            cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
            cv.put(MediaStore.Downloads.MIME_TYPE, mime);
            cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Youtmusic");
            Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
            try (OutputStream os = getContext().getContentResolver().openOutputStream(uri); InputStream is = new FileInputStream(src)) {
                byte[] b = new byte[1 << 16];
                int n;
                while ((n = is.read(b)) > 0) os.write(b, 0, n);
            }
            return "Téléchargements/Youtmusic/" + name;
        }
        File dir = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_MOVIES), "Youtmusic");
        dir.mkdirs();
        File dest = new File(dir, name);
        try (InputStream is = new FileInputStream(src); OutputStream os = new FileOutputStream(dest)) {
            byte[] b = new byte[1 << 16];
            int n;
            while ((n = is.read(b)) > 0) os.write(b, 0, n);
        }
        return dest.getAbsolutePath();
    }
}
