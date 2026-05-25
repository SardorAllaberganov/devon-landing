import { BrowserRouter } from 'react-router-dom';
import Router from './router';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
      <Toaster richColors closeButton position="top-center" />
    </BrowserRouter>
  );
}
