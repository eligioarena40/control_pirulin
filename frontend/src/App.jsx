import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import Home from './components/Home';
import Productos from './components/Productos';
import Entregas from './components/Entregas';
import Clientes from './components/Clientes';
import Pagos from './components/Pagos';
import Historial from './components/Historial';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  // Lista de temas de DaisyUI disponibles
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'caramellatte';
  });

  // Determina si el tema actual es oscuro para activar también las clases dark: de Tailwind
  const isDarkTheme = theme === 'coffee' || theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (isDarkTheme) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDarkTheme]);

  // Alterna rápidamente entre modo claro (caramellatte) y oscuro (coffee)
  const toggleLightDark = () => {
    setTheme(isDarkTheme ? 'caramellatte' : 'coffee');
  };

  return (
    <div className="min-h-screen bg-base-200 dark:bg-gray-950 text-base-content dark:text-gray-100 flex flex-col transition-colors duration-200">
      <nav className="bg-base-100 dark:bg-gray-900 shadow-sm border-b border-base-300 dark:border-gray-800 px-4 sm:px-6 py-4 flex justify-between items-center transition-colors duration-200">
        <h1
          className="text-xl font-extrabold text-amber-700 dark:text-amber-500 cursor-pointer"
          onClick={() => setActiveTab('home')}
        >
          Pirulín Control 🚀
        </h1>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Selector de temas de DaisyUI */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="select select-bordered select-sm bg-base-100 dark:bg-gray-800 text-sm"
            aria-label="Seleccionar tema"
          >
            <option value="caramellatte">Caramelo</option>
            <option value="coffee">Chocolate</option>
            <option value="bumblebee">Amarillo</option>
            <option value="corporate">Corporativo</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>

          {/* Botón rápido Sol / Luna */}
          <button
            onClick={toggleLightDark}
            className="btn btn-sm btn-ghost btn-circle text-amber-700 dark:text-amber-400"
            title={isDarkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar claro/oscuro"
          >
            {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={() => setActiveTab('home')}
            className="btn btn-sm btn-outline border-amber-600 text-amber-700 dark:border-amber-500 dark:text-amber-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-gray-950"
          >
            Inicio
          </button>
        </div>
      </nav>

      <main className="flex-1">
        {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
        {activeTab === 'entregas' && <Entregas />}
        {activeTab === 'clientes' && <Clientes />}
        {activeTab === 'pagos' && <Pagos />}
        {activeTab === 'productos' && <Productos />}
        {activeTab === 'historial' && <Historial />}
      </main>
    </div>
  );
}