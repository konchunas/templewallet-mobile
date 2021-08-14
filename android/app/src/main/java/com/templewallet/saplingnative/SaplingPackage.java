package com.templewallet.saplingnative;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import it.airgap.sapling.Sapling;

import com.templewallet.saplingnative.SaplingWrapper;

public class SaplingPackage implements ReactPackage {
    @Override   public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
    @Override   public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new SaplingWrapper(reactContext));
        return modules;
    }
}
