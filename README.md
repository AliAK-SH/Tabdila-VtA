# 🎬 Video to Audio Converter (FFmpeg)

[![Android](https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white)](https://developer.android.com)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?logo=ffmpeg&logoColor=white)](https://ffmpeg.org)

A lightweight Android app that converts any video file to high-quality audio (MP3/AAC) **locally on the device** using the power of FFmpeg. No uploads & no downloads – privacy is guaranteed.

<p align="center">
  <img src="screenshots/demo.gif" alt="App Demo" width="300">
  <br>
  <em>Select a video → choose format → get your audio in seconds</em>
</p>

That said, the project is meant to develop into a SaaS app for Iranian audiences. The *process* of this app's *development* can be traced in this rep and the code is temporarily available publicly. 

But I digress...

## ✨ Features

- [x] 📁 Convert any video format (MP4, AVI, MKV, MOV, FLV, WMV, 3GP, etc.) to **MP3** or **AAC**
- [x] 🔒 100% offline – all processing happens on your device
- [x] ⚡ Fast conversion using native FFmpeg binaries
- [x] 🎚️ Customizable audio bitrate (32 kbps – 320 kbps)
- [x] 🗂️ Extract audio from multiple videos (batch mode)
- [x] 📂 Save output files to any folder (internal or external storage)
- [x] 🔊 Preserve original audio quality with advanced tuning options
- [x] 🎨 Clean Material Design with dark/light theme
- [x] 🆓 Free, open source, no ads


## 🚀 How It Works

The app uses FFmpeg, a powerful open‑source multimedia framework, to extract audio directly from video files on your device.

The process is simple:

### 📺 Video Selection

You choose a video file from your device storage using the Android file picker.

### 🔉 Audio Stream Extraction

The app passes the video file to FFmpeg, which analyzes the media container and locates the audio stream inside the video.

### 🎞 Audio Conversion

FFmpeg then converts the audio stream into your selected format (MP3 or AAC) using the bitrate you specify.

### 🏡 Local Processing

All processing happens entirely on your device. No files are uploaded and no internet connection is required.

### 📤 Output File Creation

The converted audio file is saved to the folder you choose, ready to be played or shared.

Under the hood, the app simply acts as a clean Android interface for FFmpeg commands similar to:

```bash
ffmpeg -i input_video.mp4 -vn -ab 192k output_audio.mp3
```

Where:

- i specifies the input video
- vn removes the video stream
- ab sets the audio bitrate

the output file is encoded as MP3 or AAC.

Because FFmpeg runs natively on the device, ***conversions are fast, reliable, and completely private***.
