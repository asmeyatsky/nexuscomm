import { Platform } from 'react-native';
import Voice from '@react-native-voice/voice';

export class VoiceService {
  private static instance: VoiceService;
  private isRecording: boolean = false;
  private recognitionCallback: ((text: string) => void) | null = null;

  private constructor() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  private onSpeechStart = (e: any) => {
    console.log('Speech started');
  };

  private onSpeechEnd = (e: any) => {
    console.log('Speech ended');
    this.isRecording = false;
  };

  private onSpeechError = (e: any) => {
    console.error('Speech recognition error:', e);
    this.isRecording = false;
    if (this.recognitionCallback) {
      this.recognitionCallback('');
    }
  };

  private onSpeechResults = (e: any) => {
    if (e.value && e.value.length > 0 && this.recognitionCallback) {
      this.recognitionCallback(e.value[0]);
    }
  };

  public async startListening(callback: (text: string) => void): Promise<void> {
    if (this.isRecording) {
      return;
    }

    this.recognitionCallback = callback;
    this.isRecording = true;

    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.isRecording = false;
      callback('');
    }
  }

  public async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      this.isRecording = false;
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
      this.isRecording = false;
    }
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const isAvailable = await Voice.isAvailable();
      return isAvailable;
    } catch (error) {
      console.error('Voice recognition not available:', error);
      return false;
    }
  }

  public async destroy(): Promise<void> {
    try {
      await Voice.destroy();
      this.isRecording = false;
    } catch (error) {
      console.error('Failed to destroy voice recognition:', error);
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

// Initialize voice service
export const voiceService = VoiceService.getInstance();