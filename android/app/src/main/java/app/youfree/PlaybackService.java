package app.youfree;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

/** Service de premier plan : Android ne coupe pas la lecture quand l'appli est fermée ou l'écran éteint. */
public class PlaybackService extends Service {
    static final String CHANNEL = "lecture";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (action != null && !action.equals("show")) {
            BackgroundPlaybackPlugin.emit(action);
            return START_NOT_STICKY;
        }
        String title = intent != null ? intent.getStringExtra("title") : "Youfree";
        String text = intent != null ? intent.getStringExtra("text") : "";
        boolean playing = intent == null || intent.getBooleanExtra("playing", true);
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null)
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Lecture", NotificationManager.IMPORTANCE_LOW));
        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        Notification.Builder b = (Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this))
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(title)
            .setContentText(text)
            .setOngoing(playing)
            .setContentIntent(PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE))
            .addAction(android.R.drawable.ic_media_previous, "Précédent", act("prev"))
            .addAction(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, playing ? "Pause" : "Lecture", act("toggle"))
            .addAction(android.R.drawable.ic_media_next, "Suivant", act("next"));
        if (Build.VERSION.SDK_INT >= 29) startForeground(1, b.build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(1, b.build());
        return START_NOT_STICKY;
    }

    private PendingIntent act(String a) {
        Intent i = new Intent(this, PlaybackService.class).setAction(a);
        return PendingIntent.getService(this, a.hashCode(), i, PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public IBinder onBind(Intent i) {
        return null;
    }
}
