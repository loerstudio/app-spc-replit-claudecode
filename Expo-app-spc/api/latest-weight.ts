
import { Request, Response } from 'express';
import { getLatestWeight, initializeApp } from '../lib/database';

export default async function handler(req: Request, res: Response) {
  await initializeApp();
  
  if (req.method === 'GET') {
    try {
      const { clientId } = req.params;
      const latestWeight = await getLatestWeight(parseInt(clientId));
      res.json(latestWeight);
    } catch (error) {
      console.error('Errore caricamento ultimo peso:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  } else {
    res.status(405).json({ error: 'Metodo non supportato' });
  }
}
