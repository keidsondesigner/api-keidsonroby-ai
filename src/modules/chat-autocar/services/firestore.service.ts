import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp } from '@firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  Firestore,
} from '@firebase/firestore';

@Injectable()
export class FirestoreService {
  private readonly db: Firestore;
  private readonly logger = new Logger(FirestoreService.name);

  constructor(private configService: ConfigService) {
    // Firebase projeto: angular-chat-ai
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

    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      this.getCarData();
      this.logger.debug('Banco de dados inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar banco de dados:', error);
    }
  }

  async getCarData(): Promise<any[]> {
    try {
      const carsCollection = collection(this.db, 'cars');
      const snapshot = await getDocs(carsCollection);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      this.logger.error('Erro ao buscar dados dos carros:', error);
      throw new Error('Erro ao buscar dados dos carros');
    }
  }
}
