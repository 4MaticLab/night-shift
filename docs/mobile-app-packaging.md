# Android 与 iOS 黑客松打包

## 产物边界

Night Shift 使用 Capacitor 复用现有 Next.js 界面，不维护第二套 React Native／Flutter 页面。Android 与 iOS 原生壳默认加载 `https://night-shift-zeta.vercel.app`，因此安装包很小、服务端路由继续可用；安装后仍需要网络。仓库内的 `mobile-shell/` 只负责远端页面不可达时的品牌错误页和本地隐私说明，不是离线游戏包。

应用名为 `Night Shift`，Android application ID 与 iOS bundle ID 都是 `com.fourmaticlab.nightshift`。Android 工程位于 `android/`，iOS Xcode 工程位于 `ios/App/App.xcodeproj`，共享配置在 `capacitor.config.ts`。

## 环境与同步

统一使用 Node 22。原生依赖、插件注册和 Web 壳发生变化后运行：

```bash
npm ci
npm run mobile:sync
npm run mobile:doctor
```

默认生产地址可在同步时覆盖，适合黑客松局域网开发服或预览部署：

```bash
CAPACITOR_SERVER_URL=http://192.168.1.20:3000 npm run mobile:sync
```

Android 仅在覆盖地址为 `http://` 时开启 cleartext；正式演示应优先使用 HTTPS。每次修改 `CAPACITOR_SERVER_URL` 后都要重新同步并重打包，地址会写入原生产物。

## Android APK

本机要求 JDK 21 与 Android SDK 36。构建 debug APK：

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
npm run mobile:build:android
```

产物为 `android/app/build/outputs/apk/debug/app-debug.apk`。连接已经开启 USB 调试的 Android 手机后可直接侧载：

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Android 8 及以上可以运行应用；Health Connect 睡眠读取以设备系统服务实际可用为准。APK 只声明 `INTERNET` 与 `android.permission.health.READ_SLEEP`，不请求写健康数据、心率、血氧、呼吸或活动权限。

## iOS App

模拟器构建需要完整 Xcode：

```bash
npm run mobile:build:ios:simulator
```

产物为 `ios/build/Build/Products/Debug-iphonesimulator/App.app`。它可拖入 Simulator 或用命令安装：

```bash
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/App.app
```

模拟器包不能安装到真 iPhone。真机无需 App Store 审核，但必须由 Apple 签名：

1. 运行 `npm run mobile:open:ios`。
2. 在 Xcode 选择 `App` target 的 Signing & Capabilities。
3. 选择自己的 Team，保留 HealthKit capability，并让 Xcode 自动管理签名。
4. 连接已开启开发者模式的 iPhone，选择该设备后点击 Run。
5. 免费 Apple ID 的开发签名通常需要定期重新安装；正式长期分发仍需要 Apple Developer 账号。

`Info.plist` 只声明 HealthKit 睡眠读取用途，`App.entitlements` 只开启 HealthKit capability；没有健康写入用途声明。

## 自动产物

`.github/workflows/mobile-artifacts.yml` 在本分支 push、相关 Pull Request 和手动触发时运行：

- `Android APK` 在 Ubuntu/JDK 21/Android SDK 36 构建并检查包名和最小权限，上传 `night-shift-android-apk`。
- `iOS Simulator App` 在 `macos-15` 构建无签名模拟器 App，检查 bundle ID 与 HealthKit 说明，上传 `night-shift-ios-simulator`。

这些 artifact 适合黑客松交付与复现；iOS 真机仍按上一节在 Xcode 中以演示者身份签名。

## 睡眠数据链路

安装后的 iOS App 把 Apple Health 映射为 `apple-health`，Android App 把 Health Connect 映射为 `health-connect`。授权时只请求 `sleep` 读取权限；夜班开始时只冻结会话时间戳，不要求 App 在锁屏后台持续运行。晨间结束夜班后，原生桥按同一时间窗查询系统已经同步的睡眠记录，合并重叠区间并仅保留时长、派生质量、深睡分钟、醒转次数、置信度和主要来源名称。

原始 HealthKit／Health Connect 样本不进入游戏存档、不上传服务器。系统拒绝授权、厂商尚未把记录同步进系统健康仓、时间窗为空或桥不可用时，晨报照常完成；回到前台会再次尝试读取延迟到达的数据。Oura、Fitbit 与厂商私有 SDK 仍是界面预演。

## 黑客松现场检查

- 首次启动能打开案件书架，断网时显示本地错误页而不是空白屏。
- 开始真实夜班后锁屏，重新打开仍恢复同一会话。
- 系统健康入口只显示当前平台对应来源，并由系统弹出授权页。
- 拒绝权限和空数据都能继续结束夜班；有记录时晨报标明 Apple Health／Health Connect 或实际来源名。
- Android 用 `adb install -r` 安装；iOS 用已选 Team 的 Xcode Run 安装。
- 注入式钱包扩展和本机 Home Assistant Connector 在移动 WebView 中可能不可用，必须保持现有诚实降级。

## 相关文档

- [[docs/architecture]]
- [[docs/sleep-hardware-bridge]]
- [[docs/privacy-and-guardrails]]
- [[docs/quality-baseline]]
- [[docs/viewport-checklist]]
