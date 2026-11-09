package app.youfree;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.util.HashSet;
import java.util.Set;

/** Liste les applis capables de partager un lien, et partage directement vers l'une d'elles. */
@CapacitorPlugin(name = "ShareTargets")
public class ShareTargetsPlugin extends Plugin {

    @PluginMethod
    public void list(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        Intent send = new Intent(Intent.ACTION_SEND).setType("text/plain");
        JSArray apps = new JSArray();
        Set<String> seen = new HashSet<>();
        for (ResolveInfo r : pm.queryIntentActivities(send, 0)) {
            String pkg = r.activityInfo.packageName;
            if (!seen.add(pkg)) continue;
            JSObject o = new JSObject();
            o.put("pkg", pkg);
            o.put("label", r.loadLabel(pm).toString());
            o.put("icon", icon(r.loadIcon(pm)));
            apps.put(o);
        }
        JSObject res = new JSObject();
        res.put("apps", apps);
        call.resolve(res);
    }

    @PluginMethod
    public void share(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, call.getString("text", "")).setPackage(call.getString("pkg"));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Appli introuvable");
        }
    }

    private String icon(Drawable d) {
        Bitmap b = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        d.setBounds(0, 0, 96, 96);
        d.draw(c);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }
}
