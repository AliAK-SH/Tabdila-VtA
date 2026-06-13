import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ActivityIndicator, Dimensions, Pressable, Image, Modal, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadow } from 'react-native-shadow-2';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';
import { 
  Menu, Music, Activity, FileVideo, ShieldCheck, 
  Share2, LogOut, History, Settings, Info, Star 
} from 'lucide-react-native';
import { FFmpegKit, ReturnCode } from '../../ffmpegKit'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStorage } from '../storage/AuthStorage';

const { width, height } = Dimensions.get('window');

interface HomeScreenProps {
  onLogout: () => void;
}

export default function HomeScreen({ onLogout }: HomeScreenProps) { 
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [inputUri, setInputUri] = useState<string | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'mp3' | 'aac'>('mp3');
  const [tempVideoPath, setTempVideoPath] = useState<string | null>(null);
  const [outputFolderUri, setOutputFolderUri] = useState<string | null>(null);
  
  // Sidebar State
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const cacheDir = (FileSystem as any).cacheDirectory;
        if (cacheDir) {
          const files = await FileSystem.readDirectoryAsync(cacheDir);
          const tempFiles = files.filter(file => file.startsWith('temp_video_') || file.startsWith('temp_output_'));
          for (const file of tempFiles) {
            await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
          }
        }
      } catch (e) { console.log("Cleanup failed", e); }

      try {
        const saved = await AsyncStorage.getItem('outputFolderUri');
        if (saved) setOutputFolderUri(saved);
      } catch (e) { console.log("Load folder failed", e); }
    };

    initApp();
  }, []);

  const handleLogout = async () => {
    await AuthStorage.removeToken();
    onLogout();
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets) return;

      const pickedAsset = result.assets[0];
      let finalUri = pickedAsset.uri;

      if (finalUri.startsWith('content://')) {
        const extension = pickedAsset.name?.split('.').pop() || 'mp4';
        const localUri = `${(FileSystem as any).cacheDirectory}temp_video_${Date.now()}.${extension}`;
        await FileSystem.copyAsync({ from: finalUri, to: localUri });
        finalUri = localUri;
      }

      if (tempVideoPath) {
        await FileSystem.deleteAsync(tempVideoPath, { idempotent: true });
      }

      setTempVideoPath(finalUri);
      setInputUri(finalUri);
      setStatus('ویدیو آماده شد.');
      setSavedFilePath(null);
    } catch (error) {
      console.error(error);
      setStatus('خطا در انتخاب فایل.');
    }
  };

  const convertVideoToAudio = async () => {
    if (!inputUri) return;
    setLoading(true);
    let currentFolderUri = outputFolderUri;
    if (!currentFolderUri) {
      currentFolderUri = await requestOutputFolder();
      if (!currentFolderUri) {
        setLoading(false);
        return;
      }
    }

    try {
      const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
      const tempOutputUri = `${dir}temp_output_${Date.now()}.${selectedFormat}`;
      setStatus('در حال تبدیل...');
      const codec = selectedFormat === 'mp3' ? 'libmp3lame' : 'aac';
      const result = await FFmpegKit.execute(`-y -i "${inputUri}" -vn -acodec ${codec} "${tempOutputUri}"`);

      if (ReturnCode.isSuccess(result)) {
        setStatus('در حال انتقال به پوشه انتخاب شده...');
        try {
          const fileName = `VTA_${Date.now()}.${selectedFormat}`;
          const mimeType = selectedFormat === 'mp3' ? 'audio/mpeg' : 'audio/aac';
          const safFileUri = await FileSystem.StorageAccessFramework.createFileAsync(currentFolderUri, fileName, mimeType);
          const base64Data = await FileSystem.readAsStringAsync(tempOutputUri, { encoding: FileSystem.EncodingType.Base64 });
          await FileSystem.writeAsStringAsync(safFileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
          setSavedFilePath(safFileUri);
          setStatus('تبدیل و ذخیره با موفقیت انجام شد!');
          if (tempVideoPath) {
            await FileSystem.deleteAsync(tempVideoPath, { idempotent: true });
            setTempVideoPath(null);
          }
        } catch (exportError) {
          setStatus('خطا در ذخیره‌سازی نهایی.');
        }
      } else {
        setStatus('خطا در فرآیند تبدیل.');
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setStatus('خطایی رخ داد.');
    }
  };

  const requestOutputFolder = async () => {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) { setStatus("اجازه دسترسی داده نشد."); return null; }
    const uri = permissions.directoryUri;
    await AsyncStorage.setItem('outputFolderUri', uri);
    setOutputFolderUri(uri);
    return uri;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0a0d14', '#05070a']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout} style={styles.headerIcon}>
            <LogOut color="#fff" size={22} opacity={0.6} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.headerSubtitle}>تبدیل ویدیو به فایل صوتی با کیفیت</Text>
          </View>

          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.headerIcon}>
            <Menu color="#fff" size={28} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Pressable onPress={pickVideo} style={({ pressed }) => [
            styles.uploadCard,
            inputUri && { borderColor: '#0084ff', borderStyle: 'solid' },
            { opacity: pressed ? 0.7 : 1 }
        ]}>
          <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent']} style={styles.cardGradient} />
          <View style={styles.uploadContent}>
            <View style={styles.iconCircle}>
                <FileVideo color={inputUri ? "#0084ff" : "#8a94ad"} size={40} />
            </View>
            <Text style={styles.uploadText}>{inputUri ? "ویدیو انتخاب شد" : "بارگذاری ویدیو"}</Text>
            <Text style={styles.uploadSubtext}>{inputUri ? "برای تغییر ویدیو لمس کنید" : "برای انتخاب فایل، لمس کنید"}</Text>
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>فرمت خروجی</Text>
        </View>

        <FormatOption label="MP3" sublabel="سازگاری بالا" icon={<Music color="#fff" size={24} />} isActive={selectedFormat === 'mp3'} onPress={() => setSelectedFormat('mp3')} />
        <FormatOption label="AAC" sublabel="کیفیت بهتر" icon={<Activity color="#fff" size={24} />} isActive={selectedFormat === 'aac'} onPress={() => setSelectedFormat('aac')} />

        <View style={styles.buttonContainer}>
            <Shadow disabled={loading || !inputUri} distance={15} startColor={'rgba(0, 110, 255, 0.4)'} offset={[0, 4]}>
                <TouchableOpacity style={[styles.convertButton, !inputUri && { opacity: 0.5 }]} onPress={convertVideoToAudio} disabled={loading || !inputUri}>
                    <LinearGradient colors={['#0084ff', '#0047ab']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.buttonGradient}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>تبدیل فایل</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </Shadow>
            {status ? <Text style={styles.statusText}>{status}</Text> : null}
        </View>

        <View style={styles.footer}>
            <ShieldCheck color="#8a94ad" size={16} />
            <Text style={styles.footerText}>پردازش به صورت محلی انجام می‌شود و امنیت فایل‌ها تضمین شده‌است.</Text>
        </View>
      </SafeAreaView>

      {/* Right Sidebar Modal */}
      <Modal
        visible={isSidebarVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBlur} onPress={() => setSidebarVisible(false)} />
          <Animated.View style={styles.sidebarContainer}>
            <LinearGradient colors={['#161b26', '#0a0d14']} style={styles.sidebarGradient} />
            
            <View style={styles.sidebarHeader}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.sidebarLogo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.sidebarDivider} />

            <SidebarItem icon={<Info color="#0084ff" size={22} />} label="درباره ما" onPress={() => setSidebarVisible(false)} />
            <SidebarItem icon={<Info color="#0084ff" size={22} />} label="اپلیکیشن‌های مشابه" onPress={() => setSidebarVisible(false)} />
            <View style={styles.sidebarDivider} />

            <TouchableOpacity style={styles.premiumButton} activeOpacity={0.8}>
                <Star color="#0084ff" size={20} />
                <Text style={styles.premiumText}>ارتقاء به نسخه ویژه</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function SidebarItem({ icon, label, onPress }: any) {
    return (
        <TouchableOpacity style={styles.sidebarItem} onPress={onPress}>
            {icon}
            <Text style={styles.sidebarItemLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

function FormatOption({ label, sublabel, icon, isActive, onPress }: any) {
    return (
        <View style={[styles.optionOuter, isActive && styles.optionOuterActive]}>
            <TouchableOpacity style={[styles.optionCard, isActive && styles.optionCardActive]} onPress={onPress} activeOpacity={0.8}>
                <View style={styles.optionLeft}>
                    <View style={[styles.radio, isActive && styles.radioActive]}>{isActive && <View style={styles.radioInner} />}</View>
                    <View>
                        <Text style={styles.optionLabel}>{label}</Text>
                        <Text style={styles.optionSublabel}>{sublabel}</Text>
                    </View>
                </View>
                <View style={styles.optionIconContainer}>{icon}</View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070a' },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 30 },
  headerIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'center' },
  headerSubtitle: { color: '#8a94ad', fontSize: 11, marginTop: 2 },
  logo: { width: 200, height: 72 },

  // Sidebar Styles
  modalOverlay: { flex: 1, flexDirection: 'row' },
  modalBlur: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sidebarLogo: { width: 420, height: 140, marginTop: 40, },

  sidebarContainer: {
    width: width * 0.75,
    height: height * 0.96,
    marginTop: height * 0.02,
    marginRight: 10,
    backgroundColor: '#0a0d14',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#0084ff55',
    overflow: 'hidden',
    padding: 20,
    elevation: 20,
  },
  sidebarGradient: { ...StyleSheet.absoluteFill },
  sidebarHeader: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  sidebarLogoCircle: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#1a2436', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  sidebarTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  sidebarSubtitle: { color: '#8a94ad', fontSize: 12 },
  sidebarDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },
  sidebarItem: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10 },
  sidebarItemLabel: { color: '#fff', fontSize: 18, marginRight: 15, fontWeight: '500' },
  premiumButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,132,255,0.1)', padding: 15, borderRadius: 15, marginTop: 10 },
  premiumText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 10 },

  uploadCard: { height: 180, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  cardGradient: { ...StyleSheet.absoluteFill },
  uploadContent: { alignItems: 'center' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  uploadText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  uploadSubtext: { color: '#8a94ad', fontSize: 13, marginTop: 8 },

  sectionHeader: { width: '100%', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { color: '#8a94ad', fontSize: 14 },
  optionOuter: { width: '100%', marginBottom: 16, height: 85, justifyContent: 'center' },
  optionOuterActive: { shadowColor: '#0084ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  optionCard: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#11141b', borderRadius: 20, height: 85, paddingHorizontal: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.05)' },
  optionCardActive: { borderColor: '#0084ff', backgroundColor: '#0e1a2b' },
  optionLeft: { flexDirection: 'row-reverse', alignItems: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#444', marginLeft: 16, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#0084ff' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0084ff' },
  optionLabel: { color: '#fff', fontSize: 17, fontWeight: 'bold', textAlign: 'right' },
  optionSublabel: { color: '#8a94ad', fontSize: 12, textAlign: 'right' },
  optionIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },

  buttonContainer: { marginTop: 10, alignItems: 'center' },
  convertButton: { width: width - 48, height: 58, borderRadius: 18, overflow: 'hidden' },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
  statusText: { color: '#00ffaa', marginTop: 15, fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 20 },
  footerText: { color: '#555', fontSize: 11, marginRight: 6 },
});
