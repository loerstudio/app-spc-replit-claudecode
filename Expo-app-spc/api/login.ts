
import { verifyCredentials } from '../lib/database';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metodo non permesso' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e password richiesti' });
  }

  try {
    const isValid = await verifyCredentials(email, password);
    
    if (isValid) {
      res.status(200).json({ message: 'Login successo' });
    } else {
      res.status(401).json({ message: 'Credenziali non valide' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Errore server' });
  }
}
