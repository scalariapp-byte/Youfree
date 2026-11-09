package app.youfree;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Démarre/arrête le service de lecture et renvoie les boutons de la notification à l'appli. */
@CapacitorPlugin(name = "BackgroundPlayback")
public class BackgroundPlaybackPlugin extends Plugin {
    static BackgroundPlaybackPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    static void emit(String action) {
        if (instance == null) return;
        JSObject o = new JSObject();
        o.put("action", action);
        instance.notifyListeners("action", o);
    }

    @PluginMethod
    public void update(PluginCall call) {
        Intent i = new Intent(getContext(), PlaybackService.class).setAction("show");
        i.putExtra("title", call.getString("title", "Youtmusic"));
        i.putExtra("text", call.getString("text", ""));
        i.putExtra("playing", call.getBoolean("playing", true));
        try {
            if (Build.VERSION.SDK_INT >= 26) getContext().startForegroundService(i);
            else getContext().startService(i);
        } catch (Exception e) {
            // Démarrage refusé en arrière-plan : la lecture continue sans notification.
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), PlaybackService.class));
        call.resolve();
    }
}
