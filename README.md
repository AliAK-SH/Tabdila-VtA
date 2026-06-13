# 🎬 Video to Audio Converter (FFmpeg)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Android](https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white)](https://developer.android.com)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?logo=ffmpeg&logoColor=white)](https://ffmpeg.org)

A lightweight Android app that converts any video file to high-quality audio (MP3/AAC) **locally on your device** using the power of FFmpeg. No internet connection, no file uploads – your privacy is guaranteed.

<p align="center">
  <img src="screenshots/demo.gif" alt="App Demo" width="300">
  <br>
  <em>Select a video → choose format → get your audio in seconds</em>
</p>

## ✨ Features

- 📁 Convert any video format (MP4, AVI, MKV, MOV, FLV, WMV, 3GP, etc.) to **MP3** or **AAC**
- 🔒 100% offline – all processing happens on your device
- ⚡ Fast conversion using native FFmpeg binaries
- 🎚️ Customizable audio bitrate (32 kbps – 320 kbps)
- 🗂️ Extract audio from multiple videos (batch mode)
- 📂 Save output files to any folder (internal or external storage)
- 🔊 Preserve original audio quality with advanced tuning options
- 🎨 Clean Material Design with dark/light theme
- 🆓 Free, open source, no ads

## 📥 Download & Installation

### Option 1: Get from GitHub Releases
Go to the [Releases page](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/releases) and download the latest `app-release.apk`.

### Option 2: Build from source (see below)

### Option 3: (Future) Google Play Store
*Coming soon*

## 🚀 How It Works

The app bundles a ready-to-use [FFmpegKit](https://github.com/arthenica/ffmpeg-kit) binary for Android (ARMv7, ARM64, x86). When you select a video file, the app constructs an FFmpeg command like:

```bash
ffmpeg -i input.mp4 -vn -acodec libmp3lame -b:a 192k output.mp3