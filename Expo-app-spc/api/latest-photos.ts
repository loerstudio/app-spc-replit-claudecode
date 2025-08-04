
import { Request, Response } from 'express';
import { getKey, initializeApp } from '../lib/database';

export default async function handler(req: Request, res: Response) {
  await initializeApp();
  
  if (req.method === 'GET') {
    try {
      const { clientId } = req.params;
      const photos = await getKey('photo_progress') || [];
      const clientPhotos = photos
        .filter((p: any) => p.client_id === parseInt(clientId))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4);
      
      res.json(clientPhotos);
    } catch (error) {
      console.error('Errore caricamento foto:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  } else {
    res.status(405).json({ error: 'Metodo non supportato' });
  }
}
