package com.i10diag.pro;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.soloader.SoLoader;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() { return BuildConfig.DEBUG; }

        @Override
        protected List<ReactPackage> getPackages() {
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Ajoute le module Bluetooth SPP natif
          packages.add(new BluetoothSPPPackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() { return "index"; }

        @Override
        protected boolean isNewArchEnabled() { return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED; }

        @Override
        protected Boolean isHermesEnabled() { return BuildConfig.IS_HERMES_ENABLED; }
      };

  @Override
  public ReactNativeHost getReactNativeHost() { return mReactNativeHost; }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      DefaultNewArchitectureEntryPoint.load();
    }
  }
}
