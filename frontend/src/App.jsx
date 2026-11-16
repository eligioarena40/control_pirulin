import React, { useState } from 'react';
import Home from './components/Home';
import Productos from './components/Productos';
import Entregas from './components/Entregas';
import Clientes from './components/Clientes';
import Pagos from './components/Pagos';
import Historial from './components/Historial'; // (o la ruta donde hayas guardado el archivo)

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 
          className="text-xl font-extrabold text-amber-700 cursor-pointer"
          onClick={() => setActiveTab('home')}
        >
          Pirulín Control 🚀
        </h1>
        <button 
          onClick={() => setActiveTab('home')}
          className="btn btn-sm btn-outline border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white"
        >
          Inicio
        </button>
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