import './App.css';
import AppRouter from '@/app/router';
import { Toaster } from '@/shared/ui';

function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;
