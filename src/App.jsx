import './App.css';
import AppRouter from '@/app/router';
import { Toaster } from '@/shared/ui';
import './api/testConnection'; // Load test connection

function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App; 