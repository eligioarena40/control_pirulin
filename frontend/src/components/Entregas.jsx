import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, ShoppingCart, Plus, Minus, Send, BookUser, CheckCircle, RotateCcw, MessageCircle, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

export default function Entregas() {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientes, setClientes] = useState([]);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  
  // Datos para nuevo cliente
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDepartamento, setNuevoDepartamento] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');

  // Productos y Carrito
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState({});

  // Estado para la pantalla de éxito (ticket de venta)
  const [ventaExitosa, setVentaExitosa] = useState(null);

  useEffect(() => {
    fetchClientes();
    fetchProductos();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await api.get('/api/clientes');
      setClientes(res.data);
    } catch (error) {
      console.log('Clientes pendientes de conectar.');
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await api.get('/api/productos');
      setProductos(res.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) => {
      const actual = prev[id] || 0;
      const nuevo = actual + delta;
      if (nuevo <= 0) {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      }
      return { ...prev, [id]: nuevo };
    });
  };

  const calcularTotal = () => {
    return productos.reduce((acc, prod) => {
      const cantidad = carrito[prod._id] || 0;
      return acc + (prod.precio * cantidad);
    }, 0);
  };

  // Concretar la venta y guardar los datos para mostrarlos en el ticket
  const handleConcretarVenta = async () => {
    if (!clienteSeleccionado || Object.keys(carrito).length === 0) {
      alert('Selecciona un cliente y al menos un producto.');
      return;
    }

    try {
      // Guardamos cada producto con su propio subtotal independiente
      for (const [idProducto, cantidad] of Object.entries(carrito)) {
        const prodInfo = productos.find(p => p._id === idProducto);
        const subtotalProducto = prodInfo ? Number(prodInfo.precio) * cantidad : 0;

        await api.post('/api/entregas', {
          cliente: clienteSeleccionado._id,
          producto: idProducto,
          cantidad: cantidad,
          montoTotal: subtotalProducto, // <--- Aquí guardamos el subtotal correcto de este producto
          estadoPago: 'pendiente',
          metodoPago: 'pago_movil'
        });
      }

      // Preparamos el detalle para la tarjeta de éxito
      const itemsDetalle = Object.entries(carrito).map(([idProd, cant]) => {
        const prodInfo = productos.find(p => p._id === idProd);
        return {
          nombre: prodInfo ? prodInfo.nombre : 'Producto',
          cantidad: cant,
          precio: prodInfo ? prodInfo.precio : 0
        };
      });

      setVentaExitosa({
        cliente: clienteSeleccionado,
        items: itemsDetalle,
        total: calcularTotal(),
        fecha: new Date().toLocaleString()
      });

      // Limpiamos carrito y cliente
      setCarrito({});
      setClienteSeleccionado(null);
    } catch (error) {
      console.error('Error al registrar la venta:', error);
      alert('Hubo un error al concretar la venta en el servidor.');
    }
  };

  // Función para compartir por WhatsApp
  const handleCompartirWhatsApp = () => {
    if (!ventaExitosa) return;

    let mensaje = `📦 *RESUMEN DE ENTREGA - PIRULÍN CONTROL*\n\n`;
    mensaje += `👤 *Personal:* ${ventaExitosa.cliente.nombre}\n`;
    mensaje += `🏢 *Dpto:* ${ventaExitosa.cliente.departamento || 'General'}\n`;
    mensaje += `📅 *Fecha:* ${ventaExitosa.fecha}\n\n`;
    mensaje += `*Productos:* \n`;

    ventaExitosa.items.forEach(item => {
      mensaje += `- ${item.cantidad}x ${item.nombre} (US$ ${(item.precio * item.cantidad).toFixed(2)})\n`;
    });

    mensaje += `\n💰 *TOTAL A PAGAR:* US$ ${ventaExitosa.total.toFixed(2)}\n`;
    mensaje += `📌 *Estado:* Pendiente / Pago Móvil\n`;

    const telefonoLimpio = ventaExitosa.cliente.telefono ? ventaExitosa.cliente.telefono.replace(/\D/g, '') : '';
    const url = telefonoLimpio 
      ? `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
  };

  const handleAgregarDesdeContactos = async () => {
    if ('contacts' in navigator && 'select' in navigator.contacts) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        const contacto = await navigator.contacts.select(props, opts);
        
        if (contacto && contacto.length > 0) {
          const nombreContacto = contacto[0].name[0] || 'Sin nombre';
          const telefonoContacto = contacto[0].tel[0] || '';

          // 1. Guardamos el cliente directamente en la base de datos de MongoDB
          const res = await api.post('/api/clientes', {
            nombre: nombreContacto,
            departamento: 'General',
            telefono: telefonoContacto
          });

          const clienteGuardado = res.data;

          // 2. Actualizamos la lista y dejamos seleccionado el cliente real con su _id de MongoDB
          setClientes([clienteGuardado, ...clientes]);
          setClienteSeleccionado(clienteGuardado);
        }
      } catch (ex) {
        console.log('No se pudo acceder a los contactos', ex);
        alert('No se pudo importar el contacto.');
      }
    } else {
      alert('Selección de contactos no disponible en este navegador.');
    }
  };

  const abrirModalNuevo = () => {
    setNuevoNombre('');
    setNuevoDepartamento('');
    setNuevoTelefono('');
    setModalClienteOpen(true);
  };

  // Si la venta fue exitosa, mostramos la tarjeta resumen tipo comprobante
  if (ventaExitosa) {
    return (
      <div className="p-6 max-w-xl mx-auto pb-32">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-800">¡Venta Registrada con Éxito!</h2>
            <p className="text-sm text-gray-500">La entrega fue guardada correctamente en el sistema.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-100 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Personal / Cliente</p>
                <p className="font-bold text-gray-800">{ventaExitosa.cliente.nombre}</p>
                <p className="text-xs text-amber-700 font-semibold">Dpto: {ventaExitosa.cliente.departamento || 'General'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-semibold uppercase">Fecha</p>
                <p className="text-xs text-gray-600 font-medium">{ventaExitosa.fecha}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Productos Entregados</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {ventaExitosa.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.cantidad}x {item.nombre}</span>
                    <span className="font-semibold text-gray-900">US$ {(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-700">Total a Pagar</span>
              <span className="text-xl font-extrabold text-emerald-600">US$ {ventaExitosa.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleCompartirWhatsApp}
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center justify-center gap-2 py-3 rounded-xl shadow-md"
            >
              <MessageCircle className="w-5 h-5" />
              Compartir por WhatsApp
            </button>
            <button
              onClick={() => setVentaExitosa(null)}
              className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 border-none flex items-center justify-center gap-2 py-3 rounded-xl"
            >
              <RotateCcw className="w-5 h-5" />
              Registrar Nueva Venta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal de búsqueda de cliente y carrito
  return (
    <div className="w-full min-h-screen px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl mx-auto pb-32 overflow-x-hidden">
      
      {/* TÍTULO PRINCIPAL */}
      <div className="mb-6 bg-base-100 dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-base-300 dark:border-gray-800">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">
          Registrar Venta / Entrega
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Selecciona el departamento del personal y arma el pedido
        </p>
      </div>

      {!clienteSeleccionado ? (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8 max-w-xl mx-auto">
          
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
            <Users className="w-5 h-5 text-amber-600" />
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
              1. Buscar Personal / Cliente
            </h3>
          </div>

          {/* BARRA DE BÚSQUEDA Y BOTONES ENGROSADOS */}
          <div className="space-y-3.5 mb-6">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="search"
                autoComplete="off"
                spellCheck="false"
                placeholder="Escribe el nombre del personal..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-base sm:text-lg font-semibold text-gray-900 dark:text-white rounded-2xl shadow-xs transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={abrirModalNuevo}
                className="btn h-14 bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center justify-center gap-2 rounded-2xl font-extrabold text-sm sm:text-base shadow-md"
              >
                <UserPlus className="w-5 h-5 stroke-[2.5]" />
                Nuevo Cliente
              </button>
              <button
                onClick={handleAgregarDesdeContactos}
                className="btn h-14 btn-outline border-2 border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white hover:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-600 dark:hover:text-white flex items-center justify-center gap-2 rounded-2xl font-extrabold text-sm sm:text-base"
                title="Agregar desde contactos"
              >
                <BookUser className="w-5 h-5 stroke-[2.5]" />
                Contactos
              </button>
            </div>
          </div>

          {/* LISTA DE CLIENTES FILTRADOS */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {clientes
              .filter((c) => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()))
              .map((c) => (
                <div
                  key={c._id || c.id}
                  onClick={() => setClienteSeleccionado(c)}
                  className="p-3.5 bg-gray-50 dark:bg-gray-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-2xl cursor-pointer flex justify-between items-center transition-all duration-200 border border-gray-100 dark:border-gray-800 hover:border-amber-300 shadow-2xs"
                >
                  <div>
                    <span className="font-extrabold text-gray-900 dark:text-white block text-base capitalize">
                      {c.nombre}
                    </span>
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-0.5 inline-block">
                      Dpto: {c.departamento || 'General'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-800">
                    {c.telefono || 'Sin teléfono'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-3xl p-5 mb-8 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Personal / Cliente Asignado</span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white capitalize mt-0.5 leading-tight">
              {clienteSeleccionado.nombre}
            </h3>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mt-1">Dpto: {clienteSeleccionado.departamento || 'General'}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{clienteSeleccionado.telefono || 'Sin teléfono registrado'}</p>
          </div>
          <button
            onClick={() => {
              setClienteSeleccionado(null);
              setCarrito({});
            }}
            className="btn sm:btn-md btn-outline border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white shrink-0 rounded-xl"
          >
            Cambiar Cliente
          </button>
        </div>
      )}

      {clienteSeleccionado && (
        <div>
          {/* Cabecera optimizada: 'para la venta' baja a la segunda línea en móvil */}
          <div className="flex justify-between items-center gap-3 mb-5 w-full bg-base-100 dark:bg-gray-900 p-4 rounded-2xl border border-base-300 dark:border-gray-800">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 leading-tight flex-1">
              <ShoppingCart className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                2. Selecciona los productos <span className="block sm:inline">para la venta</span>
              </span>
            </h3>
            <div className="badge badge-lg bg-emerald-600 text-white font-extrabold px-4 py-3.5 rounded-2xl shadow-sm border-none whitespace-nowrap shrink-0">
              Items en carrito: {Object.values(carrito).reduce((a, b) => a + b, 0)}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {productos.map((prod) => {
              const cantidadEnCarrito = carrito[prod._id] || 0;

              return (
                <div
                  key={prod._id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-3 sm:p-4"
                >
                  {/* Imagen adaptativa unificada */}
                  <div className="w-full pt-3 pb-1 bg-base-200/40 dark:bg-gray-800/40 rounded-xl flex items-center justify-center overflow-hidden relative px-2 mx-auto">
                    {prod.imagenUrl && prod.imagenUrl !== 'https://example.com/default.jpg' ? (
                      <img
                        src={prod.imagenUrl}
                        alt={prod.nombre}
                        className="w-full h-auto max-h-32 sm:max-h-40 object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-300 my-4" />
                    )}
                  </div>

                  {/* Información y Precios con título maximizado */}
                  <div className="pt-3 flex-1 flex flex-col justify-between border-t border-gray-100 dark:border-gray-800 mt-2">
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-gray-100 text-base sm:text-lg lg:text-xl leading-snug line-clamp-2">
                        {prod.nombre}
                      </h3>
                      <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm sm:text-base lg:text-lg mt-1">
                        US$ {Number(prod.precio).toFixed(2)}
                      </p>
                    </div>

                    {/* Botón Agregar / Cantidad */}
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {cantidadEnCarrito === 0 ? (
                        <button
                          onClick={() => cambiarCantidad(prod._id, 1)}
                          className="w-full btn py-3 sm:py-3.5 bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center justify-center gap-2 rounded-xl font-extrabold text-xs sm:text-sm shadow-md"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" /> Agregar a Venta
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-1.5 border border-amber-300 shadow-inner">
                          <button
                            onClick={() => cambiarCantidad(prod._id, -1)}
                            className="btn btn-sm sm:btn-md btn-square btn-ghost text-rose-600"
                          >
                            <Minus className="w-5 h-5 stroke-[3]" />
                          </button>
                          <span className="font-black text-lg text-gray-900 dark:text-white px-3">{cantidadEnCarrito}</span>
                          <button
                            onClick={() => cambiarCantidad(prod._id, 1)}
                            className="btn btn-sm sm:btn-md btn-square btn-ghost text-emerald-600"
                          >
                            <Plus className="w-5 h-5 stroke-[3]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {Object.keys(carrito).length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl p-4 z-40 flex justify-between items-center max-w-5xl mx-auto rounded-t-3xl px-8">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Total a Pagar</p>
                <p className="text-2xl font-extrabold text-emerald-600">US$ {calcularTotal().toFixed(2)}</p>
              </div>
              <button
                onClick={handleConcretarVenta}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none text-lg px-8 py-3.5 rounded-2xl shadow-md flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Concretar Venta
              </button>
            </div>
          )}
        </div>
      )}

      {modalClienteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5">
            
            <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Registrar Personal / Cliente
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Ingresa los datos para guardarlos en el sistema
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Ej. Eligio Arena"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Dpto (Departamento)
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Ej. Ventas, Administración..."
                  value={nuevoDepartamento}
                  onChange={(e) => setNuevoDepartamento(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Ej. 0412-1234567"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-amber-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm font-semibold text-gray-900 dark:text-white rounded-xl shadow-2xs transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalClienteOpen(false)}
                  className="btn h-11 px-5 btn-ghost font-bold text-gray-600 dark:text-gray-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!nuevoNombre.trim()) return;
                    try {
                      const res = await api.post('/api/clientes', { 
                        nombre: nuevoNombre, 
                        departamento: nuevoDepartamento, 
                        telefono: nuevoTelefono 
                      });
                      const clienteGuardado = res.data;
                      setClientes([clienteGuardado, ...clientes]);
                      setClienteSeleccionado(clienteGuardado);
                      setModalClienteOpen(false);
                    } catch (error) {
                      console.error('Error al guardar cliente:', error);
                      alert('Error al registrar el cliente.');
                    }
                  }}
                  className="btn h-11 px-6 bg-amber-600 hover:bg-amber-700 text-white border-none font-extrabold rounded-xl shadow-md"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}