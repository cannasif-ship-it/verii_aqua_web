import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { useGlobalHorizontalDragScroll } from './hooks/useGlobalHorizontalDragScroll';
import './App.css';

function App() {
  useGlobalHorizontalDragScroll();

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
