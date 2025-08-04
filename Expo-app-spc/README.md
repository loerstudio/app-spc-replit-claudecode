
# Fitness Coach App 🏋️‍♂️

Un'applicazione completa per il coaching fitness con React Native (Expo) e Node.js backend.

## Caratteristiche

- **App Mobile**: React Native con Expo Router
- **Backend API**: Node.js con Express
- **Database**: PostgreSQL per dati persistenti
- **Real-time**: WebSocket per chat e notifiche
- **Autenticazione**: JWT con bcrypt
- **Media**: Supporto per immagini e video
- **Tracking**: Progressi peso, allenamenti e nutrizione

## Struttura del Progetto

```
├── app/                    # React Native app (Expo Router)
├── server/                 # Node.js API server
├── lib/                    # Utilità condivise
├── database/               # Schema e dati PostgreSQL
└── scripts/                # Script di setup
```

## Setup e Installazione

1. **Installa le dipendenze**:
   ```bash
   npm install
   ```

2. **Configura il database PostgreSQL**:
   ```bash
   # Esegui il workflow "Setup PostgreSQL DB"
   # oppure manualmente:
   node scripts/initPostgresDB.js
   ```

3. **Avvia l'applicazione**:
   ```bash
   # Clicca il pulsante Run o esegui:
   # Avvia API server + Expo dev server in parallelo
   ```

## Configurazione

Crea un file `.env` con:
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## API Endpoints

- `POST /api/login` - Autenticazione
- `GET /api/workouts/:clientId` - Lista allenamenti
- `POST /api/workouts` - Crea allenamento
- `GET /api/weight-progress/:clientId` - Progressi peso
- `POST /api/weight-progress` - Salva peso
- `GET /api/nutrition/:clientId` - Dati nutrizione

## WebSocket

Chat real-time disponibile su porta 8080:
```javascript
ws://localhost:8080?userId=123
```

## Tecnologie Utilizzate

### Frontend (Mobile)
- **React Native** + Expo SDK 52
- **Expo Router** per navigazione
- **TypeScript** 
- **Expo Video** per media
- **WebSocket Client** per real-time

### Backend
- **Node.js** + Express
- **PostgreSQL** con connection pooling
- **JWT** per autenticazione
- **bcryptjs** per password hashing
- **WebSocket Server** per real-time
- **CORS** configurato per Replit

## Sviluppo su Replit

Questo progetto è ottimizzato per Replit:
- Auto-deployment su commit
- PostgreSQL database integrato  
- Port forwarding configurato
- Workflows per dev e build
- Environment variables sicure

## Deploy

Il progetto si deploya automaticamente su Replit. Per deploy esterni:
1. Configura le variabili d'ambiente
2. Esegui `npm run build` (se necessario)
3. Avvia con `node server/api-server.js`

## Licenza

MIT License - Progetto educativo per coaching fitness.
