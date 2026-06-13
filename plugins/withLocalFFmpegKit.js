const { withAppBuildGradle, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const AAR_NAME = 'ffmpeg-kit-full-gpl-6.0-2.LTS.aar';

function applyAppBuildGradle(buildGradle) {
  let contents = buildGradle;

  if (!contents.includes("dirs 'libs'")) {
    contents = contents.replace(
      /android\s*\{/,
      "android {\n    repositories {\n        flatDir {\n            dirs 'libs'\n        }\n    }"
    );
  }

  const dependencyLine = "    implementation files('libs/ffmpeg-kit-full-gpl-6.0-2.LTS.aar')";
  if (!contents.includes(dependencyLine.trim())) {
    contents = contents.replace(/dependencies\s*\{/, `dependencies {\n${dependencyLine}`);
  }

  return contents;
}

function applyMainApplication(mainApplication) {
  let contents = mainApplication;

  if (!contents.includes('import com.myapp.ffmpegkit.FFmpegKitPackage')) {
    contents = contents.replace(
      'import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint',
      'import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint\nimport com.myapp.ffmpegkit.FFmpegKitPackage'
    );
  }

  if (!contents.includes('add(FFmpegKitPackage())')) {
    contents = contents.replace(
      '// add(MyReactNativePackage())',
      '// add(MyReactNativePackage())\n          add(FFmpegKitPackage())'
    );
  }

  return contents;
}

const moduleSource = `package com.myapp.ffmpegkit

import com.arthenica.ffmpegkit.FFmpegKit
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap

class FFmpegKitModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "FFmpegKitBridge"

  @ReactMethod
  fun execute(command: String, promise: Promise) {
    try {
      val session = FFmpegKit.execute(command)
      val returnCode = session.returnCode
      val result = WritableNativeMap().apply {
        putInt("returnCode", returnCode.value)
        putBoolean("isSuccess", returnCode.isValueSuccess)
        putString("output", session.allLogsAsString)
        putString("failStackTrace", session.failStackTrace)
      }
      promise.resolve(result)
    } catch (exception: Exception) {
      promise.reject("FFMPEG_KIT_EXECUTE_FAILED", exception)
    }
  }
}
`;

const packageSource = `package com.myapp.ffmpegkit

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class FFmpegKitPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(FFmpegKitModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
`;

module.exports = function withLocalFFmpegKit(config) {
  config = withAppBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = applyAppBuildGradle(modConfig.modResults.contents);
    return modConfig;
  });

  config = withMainApplication(config, (modConfig) => {
    modConfig.modResults.contents = applyMainApplication(modConfig.modResults.contents);
    return modConfig;
  });

  config = withDangerousMod(config, ['android', (modConfig) => {
    const projectRoot = modConfig.modRequest.projectRoot;
    const androidRoot = modConfig.modRequest.platformProjectRoot;
    const sourceAar = path.join(projectRoot, AAR_NAME);
    const libsDir = path.join(androidRoot, 'app', 'libs');
    fs.mkdirSync(libsDir, { recursive: true });
    fs.copyFileSync(sourceAar, path.join(libsDir, AAR_NAME));

    const moduleDir = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'myapp', 'ffmpegkit');
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(path.join(moduleDir, 'FFmpegKitModule.kt'), moduleSource);
    fs.writeFileSync(path.join(moduleDir, 'FFmpegKitPackage.kt'), packageSource);

    return modConfig;
  }]);

  return config;
};
