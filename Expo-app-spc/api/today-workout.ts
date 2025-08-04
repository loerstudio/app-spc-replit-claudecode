
import { Request, Response } from 'express';
import { getTodayWorkoutForClient, initializeApp } from '../lib/database';

export default async function handler(req: Request, res: Response) {
  await initializeApp();
  
  if (req.method === 'GET') {
    try {
      const { clientId } = req.params;
      const workout = await getTodayWorkoutForClient(parseInt(clientId));
      
      if (!workout) {
        return res.status(404).json({ error: 'Nessun workout trovato per oggi' });
      }
      
      res.json(workout);
    } catch (error) {
      console.error('Errore caricamento workout:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  } else {
    res.status(405).json({ error: 'Metodo non supportato' });
  }
}
