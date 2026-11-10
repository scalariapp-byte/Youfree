package app.youfree;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(YoutmusicDownloaderPlugin.class);
        registerPlugin(BackgroundPlaybackPlugin.class);
        registerPlugin(ShareTargetsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
