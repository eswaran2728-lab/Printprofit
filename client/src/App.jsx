import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Calculator from './pages/Calculator';
import Stock from './pages/Stock';
import More from './pages/More';
import Printers from './pages/Printers';
import Labor from './pages/Labor';
import Products from './pages/Products';

function Gate() {
  const { loading, authenticated } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-neutral-500 text-sm font-body">Loading…</div>;
  if (!authenticated) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/cost" element={<Calculator />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/more" element={<More />} />
        <Route path="/more/printers" element={<Printers />} />
        <Route path="/more/labor" element={<Labor />} />
        <Route path="/more/products" element={<Products />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
