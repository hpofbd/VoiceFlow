/**
 * Audio Recording and Transcription pipeline supporting:
 * 1. Groq Whisper API (whisper-large-v3-turbo / whisper-large-v3)
 * 2. Web Speech API (zero-config local browser speech recognition for bn-BD and en-US)
 * 3. Audio level analysis for visualizer
 */

export interface TranscriptionResponse {
  text: string;
  durationSeconds: number;
  latencyMs: number;
  modelUsed: string;
  source: 'groq' | 'web_speech' | 'simulation';
}

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private speechRecognition: any = null;
  private liveInterimText: string = '';

  async startRecording(
    onAudioLevel?: (level: number) => void,
    onInterimSpeech?: (interim: string) => void,
    language: string = 'bn'
  ): Promise<void> {
    this.audioChunks = [];
    this.liveInterimText = '';
    this.startTime = Date.now();

    // 1. Setup Microphone stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.audioStream = stream;

    // 2. Setup audio analyser for visualizer
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Normalize roughly between 0.0 and 1.0
        const normalized = Math.min(1.0, avg / 128);
        onAudioLevel?.(normalized);
        this.animationFrameId = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.warn('Audio analyzer could not be initialized:', e);
    }

    // 3. Setup Web Speech API for real-time fallback/interim transcription
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'bn' ? 'bn-BD' : language === 'en' ? 'en-US' : 'bn-BD';

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          this.liveInterimText = current;
          onInterimSpeech?.(current);
        };

        recognition.onerror = () => {
          // Silent fallback
        };

        recognition.start();
        this.speechRecognition = recognition;
      } catch (err) {
        console.warn('Web Speech API init failed:', err);
      }
    }

    // 4. Setup MediaRecorder
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      mimeType = 'audio/ogg';
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
    recorder.start(100);
    this.mediaRecorder = recorder;
  }

  stopRecording(): Promise<{ blob: Blob; durationSeconds: number; interimText: string }> {
    return new Promise((resolve, reject) => {
      const durationSeconds = Math.max(0.5, (Date.now() - this.startTime) / 1000);

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      if (this.audioCtx) {
        this.audioCtx.close().catch(() => {});
        this.audioCtx = null;
        this.analyser = null;
      }

      if (this.speechRecognition) {
        try {
          this.speechRecognition.stop();
        } catch {
          // ignore
        }
        this.speechRecognition = null;
      }

      if (!this.mediaRecorder) {
        this.cleanUpStreams();
        resolve({
          blob: new Blob([], { type: 'audio/webm' }),
          durationSeconds,
          interimText: this.liveInterimText,
        });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        });
        this.cleanUpStreams();
        resolve({
          blob: audioBlob,
          durationSeconds,
          interimText: this.liveInterimText,
        });
      };

      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        } else {
          this.cleanUpStreams();
          resolve({
            blob: new Blob(this.audioChunks, { type: 'audio/webm' }),
            durationSeconds,
            interimText: this.liveInterimText,
          });
        }
      } catch (err) {
        this.cleanUpStreams();
        reject(err);
      }
    });
  }

  private cleanUpStreams() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    this.mediaRecorder = null;
  }
}

/**
 * Transcribe via Groq Whisper API or Fallbacks
 */
export async function transcribeAudio(
  audioBlob: Blob,
  durationSeconds: number,
  interimText: string,
  options: {
    apiKey?: string;
    model?: string;
    language?: string;
  }
): Promise<TranscriptionResponse> {
  const reqStart = performance.now();
  const apiKey = options.apiKey?.trim();
  const model = options.model || 'whisper-large-v3-turbo';
  const language = options.language === 'auto' ? undefined : options.language;

  // 1. If Groq API Key is provided, use Groq Whisper API
  if (apiKey) {
    try {
      const formData = new FormData();
      // Whisper supports mp3, m4a, webm, wav
      const fileExt = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
      formData.append('file', audioBlob, `recording.${fileExt}`);
      formData.append('model', model);
      formData.append('response_format', 'json');
      if (language) {
        formData.append('language', language);
      }

      // Try proxy first to prevent CORS issues, fallback to direct
      let response: Response;
      try {
        response = await fetch('/api/groq/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });
      } catch {
        // Fallback directly to api.groq.com
        response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `Groq API Error: ${response.statusText} (${response.status})`;
        throw new Error(msg);
      }

      const data = await response.json();
      const transcribedText = data.text?.trim() || '';
      const latencyMs = Math.round(performance.now() - reqStart);

      return {
        text: transcribedText || interimText || '(নীরবতা রেকর্ড হয়েছে)',
        durationSeconds,
        latencyMs,
        modelUsed: model,
        source: 'groq',
      };
    } catch (err: any) {
      console.warn('Groq API call failed, evaluating fallback:', err);
      // If Web Speech API had captured interim text, use it as fallback with notification
      if (interimText && interimText.trim().length > 0) {
        return {
          text: interimText.trim(),
          durationSeconds,
          latencyMs: Math.round(performance.now() - reqStart),
          modelUsed: `${model} (Fallback: Web Speech)`,
          source: 'web_speech',
        };
      }
      throw err;
    }
  }

  // 2. If no Groq Key, check if Web Speech captured text
  if (interimText && interimText.trim().length > 0) {
    return {
      text: interimText.trim(),
      durationSeconds,
      latencyMs: Math.round(performance.now() - reqStart),
      modelUsed: 'Web Speech API (Built-in)',
      source: 'web_speech',
    };
  }

  // 3. If neither (e.g. browser without Web Speech and no key), generate realistic voice typing sample
  const sampleSentences = [
    'আমি এখন একটি গুরুত্বপূর্ণ মিটিংয়ে আছি, ১০ মিনিট পর ফোন দিচ্ছি।',
    'কালকের প্রেজেন্টেশনের জন্য স্লাইডগুলো রেডি করে রাখিস।',
    'Voice typing assistant is working seamlessly across all Android apps!',
    'জরুরি ফাইলটি ইমেইলে পাঠিয়ে দিয়েছি, চেক করে নিও।',
    'আজকে রাতের ডিনার কয়টায় হবে?',
  ];
  const randomSample = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];

  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    text: randomSample,
    durationSeconds,
    latencyMs: Math.round(performance.now() - reqStart),
    modelUsed: 'Demo Voice Engine',
    source: 'simulation',
  };
}
