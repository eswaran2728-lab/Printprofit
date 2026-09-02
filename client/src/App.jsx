import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Hardware from './pages/Hardware';
import Printers from './pages/Printers';
import Labor from './pages/Labor';
import Products from './pages/Products';
import Pricing from './pages/Pricing';
import Sales from './pages/Sales';

function Gate() {
  const { loading, authenticated } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (!authenticated) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/hardware" element={<Hardware />} />
        <Route path="/printers" element={<Printers />} />
        <Route path="/labor" element={<Labor />} />
        <Route path="/products" element={<Products />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/sales" element={<Sales />} />
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
