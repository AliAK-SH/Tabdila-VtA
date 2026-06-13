import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Image, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, ShieldCheck } from 'lucide-react-native';
import { AuthStorage } from '../storage/AuthStorage';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(119);

  // Refs for auto-focusing OTP boxes
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * MOCK API: Requesting OTP
   */
  const handleSendOTP = async () => {
    if (phone.length < 10) {
      alert("لطفا شماره موبایل معتبر وارد کنید");
      return;
    }
    
    setLoading(true);
    
    // Simulate network delay (1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setStep('otp');
    setTimer(119);
    console.log(`Mock: Code sent to 0${phone}. Use code: 1234`);
  };

  /**
   * MOCK API: Verifying OTP
   */
  const handleVerifyOTP = async (codeArray: string[]) => {
    const fullCode = codeArray.join('');
    if (fullCode.length === 4) {
      setLoading(true);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // LOGIC: Accept '1234' as the valid code for testing
      if (fullCode === '1234') {
        const mockToken = "mock_jwt_token_for_demo_purposes";
        await AuthStorage.saveToken(mockToken);
        onLoginSuccess(mockToken);
      } else {
        setLoading(false);
        alert("کد وارد شده صحیح نیست. برای تست از 1234 استفاده کنید.");
        setOtp(['', '', '', '']); 
        inputRefs[0].current?.focus();
      }
    }
  };

  const updateOtp = (value: string, index: number) => {
    const newOtp = [...otp];
    // Take only the last character (prevents bugs if someone pastes)
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next box
    if (value !== '' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    
    // Auto-submit if last box filled
    if (newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#05070a', '#0a0d14']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.content}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{flex: 1, alignItems: 'center', width: '100%'}}
        >
          
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          
          <Text style={styles.title}>تأیید شماره موبایل</Text>
          <Text style={styles.subtitle}>برای ادامه، شماره موبایل خود را وارد کنید</Text>

          {/* Phone Input */}
          <View style={[styles.inputContainer, step === 'otp' && { opacity: 0.5 }]}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+98</Text>
            </View>
            <View style={styles.inputDivider} />
            <TextInput
              style={styles.phoneInput}
              placeholder="912 345 6789"
              placeholderTextColor="#4a5568"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              editable={step === 'phone' && !loading}
            />
          </View>

          {step === 'phone' && (
            <TouchableOpacity style={styles.sendButton} onPress={handleSendOTP} disabled={loading}>
              <LinearGradient colors={['#0084ff', '#0047ab']} style={styles.buttonGradient}>
                 {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>دریافت کد</Text>}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* OTP Section */}
          {step === 'otp' && (
            <View style={styles.otpSection}>
              <Text style={styles.otpInstruction}>
                کد <Text style={{color: '#0084ff', fontWeight: 'bold'}}>4 رقمی</Text> ارسال‌شده به شماره شما را وارد کنید
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <View key={index} style={[styles.otpBox, digit !== '' && styles.otpBoxActive]}>
                    <TextInput
                      ref={inputRefs[index]}
                      style={styles.otpInput}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(v) => updateOtp(v, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      textAlign="center"
                      editable={!loading}
                    />
                    {digit === '' && <View style={styles.dot} />}
                  </View>
                ))}
              </View>

              {loading && (
                <View style={{marginTop: 20}}>
                   <ActivityIndicator color="#0084ff" size="large" />
                </View>
              )}

              {!loading && (
                <>
                  <View style={styles.timerContainer}>
                    <Text style={styles.timerLabel}>زمان باقی‌مانده:</Text>
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                    <Clock color="#0084ff" size={20} />
                  </View>

                  <TouchableOpacity 
                    style={styles.resendContainer} 
                    disabled={timer > 0} 
                    onPress={() => { setStep('phone'); setOtp(['','','','']); }}
                  >
                    <Text style={styles.resendLabel}>کد را دریافت نکردید؟ </Text>
                    <Text style={[styles.resendText, timer === 0 && {color: '#0084ff'}]}>ارسال مجدد کد</Text>
                  
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          <View style={styles.footer}>
             <ShieldCheck color="#0084ff" size={18} />
             <Text style={styles.footerText}>اطلاعات شما ایمن و رمزنگاری شده است</Text>

          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070a' },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', direction: 'ltr' },
  logo: { width: 200, height: 72, marginTop: 40 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  subtitle: { color: '#8a94ad', fontSize: 13, marginTop: 8, marginBottom: 40 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(0,132,255,0.3)',
    height: 70,
    paddingHorizontal: 8,
    width: '100%',
    direction: 'ltr'
  },
  countryCode: { paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  countryCodeText: { color: '#fff', fontSize: 20, fontWeight: '500' },
  inputDivider: { width: 1, height: '35%', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
  phoneInput: { flex: 1, color: '#fff', fontSize: 20, textAlign: 'right', paddingHorizontal: 12, fontWeight: '500' },
  sendButton: { borderRadius: 15, overflow: 'hidden', height: 52, width: 105, marginTop: 16, alignSelf: 'center' },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  otpSection: { width: '100%', alignItems: 'center', marginTop: 40 },
  otpInstruction: { color: '#8a94ad', fontSize: 14, marginBottom: 25 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  otpBox: {
    width: (width - 100) / 4,
    height: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  otpBoxActive: { borderColor: '#0084ff', backgroundColor: 'rgba(0,132,255,0.08)' },
  otpInput: { color: '#fff', fontSize: 32, position: 'absolute', width: '100%', height: '100%', textAlign: 'center', fontWeight: 'bold', direction: 'ltr' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155' },

  timerContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(0,132,255,0.05)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,132,255,0.2)',
    marginTop: 40
  },
  timerText: { color: '#0084ff', fontSize: 18, fontWeight: 'bold', marginHorizontal: 10, writingDirection: 'rtl'},
  timerLabel: { color: '#8a94ad', fontSize: 14, writingDirection: 'rtl' },

  resendContainer: { flexDirection: 'row-reverse', marginTop: 30 },
  resendText: { color: '#334155', fontWeight: 'bold' , writingDirection: 'rtl'},
  resendLabel: { color: '#8a94ad', writingDirection: 'rtl' },

  footer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    direction: 'rtl'
  },
  footerText: { color: '#64748b', fontSize: 11, marginLeft: 10, writingDirection: 'rtl' },
});
