import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinataStorageService } from './pinata-storage.service';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

export interface ChatLocutorGeneration {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  audio_path: string;
  created_at: Date;
}

@Injectable()
export class ChatLocutorService {
  private readonly logger = new Logger(ChatLocutorService.name);
  private readonly db: any;
  private readonly elevenlabsApiKey: string;
  private readonly voiceId: string = 'UaeEQHfiDI8l58WWXiwS';

  constructor(
    private configService: ConfigService,
    private pinataService: PinataStorageService,
  ) {
    this.elevenlabsApiKey =
      this.configService.get<string>('ELEVENLABS_API_KEY');

    if (!this.elevenlabsApiKey) {
      this.logger.error('ELEVENLABS_API_KEY is not configured');
    }

    // Initialize Firebase for Locutor
    const firebaseConfig = {
      apiKey: this.configService.get<string>('FIREBASE_API_KEY'),
      authDomain: this.configService.get<string>('FIREBASE_AUTH_DOMAIN'),
      projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: this.configService.get<string>(
        'FIREBASE_MESSAGING_SENDER_ID',
      ),
      appId: this.configService.get<string>('FIREBASE_APP_ID'),
    };

    const app = initializeApp(firebaseConfig, 'locutor-tts-app');
    this.db = getFirestore(app);
  }

  async getGenerations(): Promise<ChatLocutorGeneration[]> {
    try {
      const generationsRef = collection(this.db, 'generations');
      const snapshot = await getDocs(generationsRef);
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate(),
          }) as ChatLocutorGeneration,
      );
    } catch (error) {
      this.logger.error('Error fetching generations:', error);
      return [];
    }
  }

  async generateSpeech(
    text: string,
    title: string,
  ): Promise<ChatLocutorGeneration> {
    try {
      this.logger.debug('Generating speech with ElevenLabs:', { text, title });

      // Validar parâmetros
      if (!text || !title) {
        throw new Error('Text and title are required');
      }

      // Gerar áudio com ElevenLabs
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenlabsApiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        this.logger.error('ElevenLabs API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(`Failed to generate speech: ${response.statusText}`);
      }

      // Obter o buffer de áudio
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Received empty audio data from ElevenLabs');
      }

      const audioBuffer = Buffer.from(arrayBuffer);
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${Date.now()}_${sanitizedTitle}.mp3`;

      this.logger.debug('Uploading audio to Pinata:', {
        filename,
        size: audioBuffer.length,
      });
      const { path } = await this.pinataService.uploadAudio(
        audioBuffer,
        filename,
      );

      this.logger.debug('Saving generation to Firebase:', { title, path });
      const generationsRef = collection(this.db, 'generations');
      const generation: Partial<ChatLocutorGeneration> = {
        title,
        content: text,
        audio_path: path,
        created_at: new Date(),
      };

      const docRef = await addDoc(generationsRef, generation);
      return {
        id: docRef.id,
        ...generation,
      } as ChatLocutorGeneration;
    } catch (error) {
      this.logger.error('Error in generateSpeech:', error);
      throw error;
    }
  }

  async deleteGeneration(id: string): Promise<void> {
    try {
      const generationRef = doc(this.db, 'generations', id);
      await deleteDoc(generationRef);
    } catch (error) {
      this.logger.error('Error deleting generation:', error);
      throw error;
    }
  }
}
