import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import { Toaster } from '@/components/ui/sonner';
import { useMediaQuery } from '@/lib/use-media-query';

export default function App() {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
      <Toaster
        richColors
        closeButton
        position={isDesktop ? 'bottom-right' : 'top-center'}
      />
    </BrowserRouter>
  );
}
