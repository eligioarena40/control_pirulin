import React from 'react';
import { ShoppingCart, Users, DollarSign, Package, Clock, ArrowUpRight } from 'lucide-react';

export default function Home({ setActiveTab }) {
  const menuCards = [
    {
      id: 'entregas',
      title: 'Registrar Venta / Entrega',
      description: 'Anota nuevos pedidos y entregas de Pirulín.',
      icon: <ShoppingCart className="w-8 h-8 text-emerald-500" />,
      bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    },
    {
      id: 'clientes',
      title: 'Clientes',
      description: 'Gestiona la lista de clientes por departamento.',
      icon: <Users className="w-8 h-8 text-blue-500" />,
      bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
      id: 'pagos',
      title: 'Registrar Pago',
      description: 'Registra pagos móviles y adjunta comprobantes.',
      icon: <DollarSign className="w-8 h-8 text-amber-500" />,
      bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    },
    {
      id: 'productos',
      title: 'Catálogo de Productos',
      description: 'Agrega, actualiza o elimina productos y sus fotos.',
      icon: <Package className="w-8 h-8 text-purple-500" />,
      bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    },
    {
      id: 'historial',
      title: 'Historial y Deudas',
      description: 'Revisa entregas pasadas y estados de cuenta.',
      icon: <Clock className="w-8 h-8 text-rose-500" />,
      bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100',
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Cuadrícula de Tarjetas del Menú */}
      <h2 className="text-xl font-bold text-gray-700">Menú Principal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuCards.map((card) => (
          <div
            key={card.id}
            onClick={() => setActiveTab && setActiveTab(card.id)}
            className={`card border cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl p-6 rounded-2xl ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                {card.icon}
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{card.title}</h3>
            <p className="text-sm text-gray-600">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}