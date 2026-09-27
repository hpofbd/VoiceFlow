export type BubbleState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export type AppTarget = 'messenger' | 'notes' | 'email' | 'search' | 'social';

export interface VoiceSettings {
  groqApiKey: string;
  model: 'whisper-large-v3-turbo' | 'whisper-large-v3';
  language: 'auto' | 'bn' | 'en';
  maxRecordingDuration: number; // in seconds, default 60
  injectionMode: 'set_text' | 'paste';
  soundFeedback: boolean;
  hapticFeedback: boolean;
  interactionMode: 'tap_toggle' | 'hold_to_record';
  accessibilityServiceEnabled: boolean;
  overlayPermissionGranted: boolean;
  micPermissionGranted: boolean;
  disclosureAccepted: boolean;
}

export interface TranscriptionRecord {
  id: string;
  timestamp: number;
  text: string;
  durationSeconds: number;
  modelUsed: string;
  targetApp: AppTarget;
  languageDetected?: string;
  source: 'groq' | 'web_speech' | 'simulation';
}

export interface KotlinFile {
  id: string;
  filename: string;
  path: string;
  category: 'Service' | 'Remote / API' | 'Domain / UseCase' | 'Presentation' | 'Configuration';
  description: string;
  code: string;
}
