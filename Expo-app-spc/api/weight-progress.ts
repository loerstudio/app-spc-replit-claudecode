
import { Request, Response } from 'express';
import { getWeightProgress, saveWeightProgress, initializeApp } from '../lib/database';

export default async function handler(req: Request, res: Response) {
  await initializeApp();
  
  if (req.method === 'GET') {
    try {
      const { clientId } = req.params;
      const progress = await getWeightProgress(parseInt(clientId), 30);
      res.json(progress);
    } catch (error) {
      console.error('Errore caricamento peso:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  } else if (req.method === 'POST') {
    try {
      const { clientId } = req.params;
      const { weight, notes } = req.body;
      const entry = await saveWeightProgress(parseInt(clientId), weight, notes);
      res.json(entry);
    } catch (error) {
      console.error('Errore salvataggio peso:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  } else {
    res.status(405).json({ error: 'Metodo non supportato' });
  }
}
