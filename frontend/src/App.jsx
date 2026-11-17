import React, { useState, useEffect } from 'react';
import { Sun, Moon, Home as HomeIcon } from 'lucide-react';
import Home from './components/Home';
import Productos from './components/Productos';
import Entregas from './components/Entregas';
import Clientes from './components/Clientes';
import Pagos from './components/Pagos';
import Historial from './components/Historial';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'caramellatte';
  });

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

  const toggleLightDark = () => {
    setTheme(isDarkTheme ? 'caramellatte' : 'coffee');
  };

  const isHome = activeTab === 'home';

  return (
    <div className="min-h-screen w-full bg-base-200 dark:bg-gray-950 text-base-content dark:text-gray-100 flex flex-col transition-colors duration-200 relative overflow-x-hidden">
      
      <nav 
        className={`${
          isHome 
            ? 'absolute top-0 left-0 w-full z-50 bg-transparent border-none shadow-none py-3.5 px-3 sm:px-6' 
            : 'bg-base-100 dark:bg-gray-900 shadow-sm border-b border-base-300 dark:border-gray-800 py-4 px-3 sm:px-6'
        } flex justify-between items-center transition-colors duration-200`}
      >
        <div></div>

        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* SELECTOR DE TEMAS AMPLIADO */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className={`select select-bordered select-md text-sm sm:text-base font-medium px-3 ${
              isHome 
                ? 'bg-black/50 backdrop-blur-md text-white border-white/30' 
                : 'bg-base-100 dark:bg-gray-800'
            }`}
            aria-label="Seleccionar tema"
          >
            <option value="caramellatte" className="text-black">Caramelo</option>
            <option value="coffee" className="text-black">Chocolate</option>
            <option value="bumblebee" className="text-black">Amarillo</option>
            <option value="corporate" className="text-black">Corporativo</option>
            <option value="light" className="text-black">Claro</option>
            <option value="dark" className="text-black">Oscuro</option>
          </select>

          {/* BOTÓN SOL / LUNA AMPLIADO */}
          <button
            onClick={toggleLightDark}
            className={`btn btn-md btn-ghost btn-circle ${
              isHome ? 'text-white hover:bg-white/20' : 'text-amber-700 dark:text-amber-400'
            }`}
            title={isDarkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar claro/oscuro"
          >
            {isDarkTheme ? <Sun size={23} /> : <Moon size={23} />}
          </button>

          {/* BOTÓN INICIO EN PÍLDORA */}
          <button
            onClick={() => setActiveTab('home')}
            className={`btn px-5 sm:px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg transition-all text-sm sm:text-base font-bold ${
              isHome
                ? 'bg-white/30 hover:bg-white/40 text-white border border-white/50 backdrop-blur-md'
                : 'bg-amber-600 hover:bg-amber-700 text-white border-none dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-gray-950'
            }`}
          >
            <HomeIcon size={19} />
            <span>Inicio</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full">
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