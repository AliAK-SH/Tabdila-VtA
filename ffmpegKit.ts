import { NativeModules } from 'react-native';

type FFmpegKitResult = {
  returnCode: number;
  isSuccess: boolean;
  output?: string;
  failStackTrace?: string;
};

const { FFmpegKitBridge } = NativeModules;

export const FFmpegKit = {
  execute(command: string): Promise<FFmpegKitResult> {
    if (!FFmpegKitBridge) {
      return Promise.reject(new Error('FFmpegKit native module is not available.'));
    }

    return FFmpegKitBridge.execute(command);
  },
};

export const ReturnCode = {
  isSuccess(result?: FFmpegKitResult | null): boolean {
    return result?.isSuccess === true || result?.returnCode === 0;
  },
};
