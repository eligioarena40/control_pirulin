import React from 'react';
import { ShoppingCart, Users, DollarSign, Package, Clock, ArrowUpRight } from 'lucide-react';

export default function Home({ setActiveTab }) {
  const menuCards = [
    {
      id: 'entregas',
      title: 'Registrar Venta / Entrega',
      description: 'Anota nuevos pedidos y entregas de Pirulín.',
      icon: <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />,
      bg: 'bg-emerald-50/95 border-emerald-200 hover:bg-emerald-100',
    },
    {
      id: 'clientes',
      title: 'Clientes',
      description: 'Gestiona la lista de clientes por departamento.',
      icon: <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />,
      bg: 'bg-blue-50/95 border-blue-200 hover:bg-blue-100',
    },
    {
      id: 'pagos',
      title: 'Registrar Pago',
      description: 'Registra pagos móviles y adjunta comprobantes.',
      icon: <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />,
      bg: 'bg-amber-50/95 border-amber-200 hover:bg-amber-100',
    },
    {
      id: 'productos',
      title: 'Catálogo de Productos',
      description: 'Agrega, actualiza o elimina productos y sus fotos.',
      icon: <Package className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500" />,
      bg: 'bg-purple-50/95 border-purple-200 hover:bg-purple-100',
    },
    {
      id: 'historial',
      title: 'Historial y Deudas',
      description: 'Revisa entregas pasadas y estados de cuenta.',
      icon: <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500" />,
      bg: 'bg-rose-50/95 border-rose-200 hover:bg-rose-100',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-amber-200 via-amber-800/70 to-neutral-950 pb-24 overflow-x-hidden">
      
      {/* BANNER SUPERIOR */}
      <div className="relative w-full h-[32vh] sm:h-[35vh] lg:h-[40vh] min-h-[220px] max-h-[380px] flex flex-col justify-center items-center text-white px-4 shadow-xl mb-6 overflow-hidden bg-gradient-to-r from-neutral-950 via-amber-900 to-neutral-950">
        
        {/* Imagen central adaptativa */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 h-full w-full flex items-center justify-center pointer-events-none z-0">
          <div className="relative h-full py-2 flex items-center justify-center">
            <img
              src="/banner_pirulin.png"
              alt="Pirulín"
              className="h-[85%] sm:h-[90%] w-auto object-contain drop-shadow-2xl opacity-95 scale-110 sm:scale-100"
            />
          </div>
        </div>

        {/* Capa oscura de contraste */}
        <div className="absolute inset-0 bg-black/45 z-10"></div>

        {/* Textos del Banner */}
        <div className="relative z-20 text-center space-y-2 max-w-xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-md">
            Pirulín TITO
          </h2>
          <p className="text-amber-100 text-sm sm:text-base lg:text-lg drop-shadow font-medium">
            Organiza tus entregas, clientes y deudas de forma rápida y sencilla.
          </p>
        </div>
      </div>

      {/* CUADRÍCULA DE TARJETAS */}
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 lg:gap-6">
          {menuCards.map((card, index) => {
            const isLastCard = index === menuCards.length - 1;

            return (
              <div
                key={card.id}
                onClick={() => setActiveTab && setActiveTab(card.id)}
                className={`card border cursor-pointer transition-all duration-300 transform active:scale-95 hover:-translate-y-1 hover:shadow-2xl p-4 sm:p-5 lg:p-6 rounded-2xl shadow-md ${card.bg} ${
                  isLastCard ? 'col-span-2 max-w-[75%] sm:max-w-[60%] mx-auto w-full lg:col-span-1 lg:max-w-none' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 sm:p-3 bg-white rounded-xl shadow-sm">
                    {card.icon}
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-500" />
                </div>

                {/* TÍTULOS CON LETRA AMPLIADA (text-base en móvil y text-lg/xl en pantallas grandes) */}
                <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-gray-900 mb-1.5 leading-snug">
                  {card.title}
                </h3>

                {/* Descripciones legibles */}
                <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}