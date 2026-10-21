import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Configuración web del proyecto de Firebase. Es pública por diseño: la seguridad vive en las reglas de la base de datos.
const firebaseConfig = {
  apiKey: 'AIzaSyDB_bx2-dKTrXBJ-mU_9iCzInYZ5iGq7yI',
  authDomain: 'game-23826.firebaseapp.com',
  databaseURL: 'https://game-23826-default-rtdb.firebaseio.com',
  projectId: 'game-23826',
  storageBucket: 'game-23826.firebasestorage.app',
  messagingSenderId: '402870991810',
  appId: '1:402870991810:web:78cfdf119fde4b751cf45b',
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
