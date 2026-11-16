import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, ShoppingCart, Plus, Minus, Send, BookUser, CheckCircle, RotateCcw, MessageCircle } from 'lucide-react';
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
      for (const [idProducto, cantidad] of Object.entries(carrito)) {
        await api.post('/api/entregas', {
          cliente: clienteSeleccionado._id,
          producto: idProducto,
          cantidad: cantidad,
          montoTotal: calcularTotal(),
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
          const nuevo = {
            _id: Date.now().toString(),
            nombre: contacto[0].name[0] || 'Sin nombre',
            departamento: 'General',
            telefono: contacto[0].tel[0] || ''
          };
          setClientes([nuevo, ...clientes]);
          setClienteSeleccionado(nuevo);
        }
      } catch (ex) {
        console.log('No se pudo acceder', ex);
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
    <div className="p-6 max-w-6xl mx-auto pb-32">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Registrar Venta / Entrega</h2>
        <p className="text-sm text-gray-500">Selecciona el departamento del personal y arma el pedido</p>
      </div>

      {!clienteSeleccionado ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            1. Buscar Personal / Cliente por Nombre o Letra
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="busqueda_personal_libre"
                placeholder="Escribe el nombre..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className="input input-bordered w-full pl-10 bg-gray-50"
              />
            </div>
            <button
              onClick={abrirModalNuevo}
              className="btn bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo
            </button>
            <button
              onClick={handleAgregarDesdeContactos}
              className="btn btn-outline border-amber-600 text-amber-700 hover:bg-amber-50 flex items-center gap-1"
              title="Agregar desde contactos"
            >
              <BookUser className="w-4 h-4" />
              Contactos
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {clientes
              .filter((c) => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()))
              .map((c) => (
                <div
                  key={c._id || c.id}
                  onClick={() => setClienteSeleccionado(c)}
                  className="p-3 bg-gray-50 hover:bg-amber-50 rounded-xl cursor-pointer flex justify-between items-center transition border border-transparent hover:border-amber-200"
                >
                  <div>
                    <span className="font-medium text-gray-800 block">{c.nombre}</span>
                    <span className="text-xs text-amber-700 font-semibold">Dpto: {c.departamento || 'General'}</span>
                  </div>
                  <span className="text-xs text-gray-500">{c.telefono || 'Sin teléfono'}</span>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Personal / Cliente Asignado</span>
            <h3 className="text-xl font-extrabold text-gray-900">{clienteSeleccionado.nombre}</h3>
            <p className="text-sm font-semibold text-amber-800">Dpto: {clienteSeleccionado.departamento || 'General'}</p>
            <p className="text-xs text-gray-600">{clienteSeleccionado.telefono || 'Sin teléfono registrado'}</p>
          </div>
          <button
            onClick={() => {
              setClienteSeleccionado(null);
              setCarrito({});
            }}
            className="btn btn-sm btn-outline border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white"
          >
            Cambiar Cliente
          </button>
        </div>
      )}

      {clienteSeleccionado && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              2. Selecciona los productos para la venta
            </h3>
            <div className="badge badge-lg bg-amber-600 text-white font-bold p-3">
              Items en carrito: {Object.values(carrito).reduce((a, b) => a + b, 0)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map((prod) => {
              const cantidadEnCarrito = carrito[prod._id] || 0;

              return (
                <div
                  key={prod._id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {prod.imagenUrl ? (
                      <img src={prod.imagenUrl} alt={prod.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="w-10 h-10 text-gray-300" />
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 leading-tight">{prod.nombre}</h4>
                      <p className="text-emerald-600 font-extrabold text-lg mt-1">
                        US$ {Number(prod.precio).toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      {cantidadEnCarrito === 0 ? (
                        <button
                          onClick={() => cambiarCantidad(prod._id, 1)}
                          className="w-full btn btn-sm bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Agregar a Venta
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full bg-gray-50 rounded-xl p-1 border border-amber-300">
                          <button
                            onClick={() => cambiarCantidad(prod._id, -1)}
                            className="btn btn-sm btn-square btn-ghost text-rose-600"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-extrabold text-lg text-gray-800 px-3">{cantidadEnCarrito}</span>
                          <button
                            onClick={() => cambiarCantidad(prod._id, 1)}
                            className="btn btn-sm btn-square btn-ghost text-emerald-600"
                          >
                            <Plus className="w-4 h-4" />
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
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-40 flex justify-between items-center max-w-5xl mx-auto rounded-t-2xl px-8">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Total a Pagar</p>
                <p className="text-2xl font-extrabold text-emerald-600">US$ {calcularTotal().toFixed(2)}</p>
              </div>
              <button
                onClick={handleConcretarVenta}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none text-lg px-8 py-3 rounded-xl shadow-md flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Concretar Venta
              </button>
            </div>
          )}
        </div>
      )}

      {modalClienteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Registrar Personal / Cliente</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre y Apellido</label>
                <input
                  type="text"
                  placeholder="Ej. Eligio Arena"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="input input-bordered w-full bg-gray-50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dpto (Departamento)</label>
                <input
                  type="text"
                  placeholder="Ej. Ventas, Administración..."
                  value={nuevoDepartamento}
                  onChange={(e) => setNuevoDepartamento(e.target.value)}
                  className="input input-bordered w-full bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ej. 0412-1234567"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  className="input input-bordered w-full bg-gray-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button onClick={() => setModalClienteOpen(false)} className="btn btn-ghost btn-sm">
                  Cancelar
                </button>
                <button
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
                  className="btn btn-sm bg-amber-600 text-white border-none"
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