
import { Request, Response } from 'express';
import { getKey, setKey } from '../lib/database';

export default async function handler(req: Request, res: Response) {
  if (req.method === 'POST') {
    try {
      const { workoutId } = req.params;
      const workouts = await getKey('workouts') || [];
      
      const workoutIndex = workouts.findIndex((w: any) => w.id === parseInt(workoutId));
      if (workoutIndex === -1) {
        return res.status(404).json({ error: 'Workout non trovato' });
      }
      
      workouts[workoutIndex].completed = true;
      await setKey('workouts', workouts);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Errore completamento workout:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  } else {
    res.status(405).json({ error: 'Metodo non supportato' });
  }
}
