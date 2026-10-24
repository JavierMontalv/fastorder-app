import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import MenuSetupGuide from './MenuSetupGuide';
import { guideStorageKey } from '../config/menuSetupGuide.mjs';

export default function WelcomePresentation() {
  const { user } = useContext(AuthContext);
  if (!user || !['owner', 'admin'].includes(user.rol)) return null;
  const storageKey = guideStorageKey(user);
  return <MenuSetupGuide key={storageKey} storageKey={storageKey} />;
}
