import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, X, Check } from 'lucide-react';
import api from '../services/api';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/productos');
      setProductos(res.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const abrirCrear = () => {
    setEditId(null);
    setNombre('');
    setPrecio('');
    setImagen(null);
    setPreview(null);
    setModalOpen(true);
  };

  const abrirEditar = (prod) => {
    setEditId(prod._id);
    setNombre(prod.nombre);
    setPrecio(prod.precio);
    setImagen(null);
    setPreview(prod.imagenUrl || null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !precio) return;

    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('precio', precio);
      
      if (imagen) {
        formData.append('imagen', imagen); 
      }

      if (editId) {
        await api.put(`/api/productos/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/api/productos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setModalOpen(false);
      fetchProductos();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Hubo un error al guardar el producto.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas quitar este producto del catálogo?')) return;
    try {
      await api.delete(`/api/productos/${id}`);
      fetchProductos();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  return (
    <div className="w-full min-h-screen px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto overflow-x-hidden">
      
      {/* ENCABEZADO RESPONSIVO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-base-100 dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-base-300 dark:border-gray-800">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">
            Catálogo de Productos
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Agrega, edita o quita productos disponibles
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="w-full sm:w-auto btn bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 shadow-md font-bold text-sm sm:text-base"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* CUADRÍCULA DE TARJETAS RESPONSIVA */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 text-base">Cargando catálogo...</div>
      ) : productos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6">
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm sm:text-base">
            Aún no hay productos registrados en el catálogo.
          </p>
          <button onClick={abrirCrear} className="btn btn-sm sm:btn-md bg-amber-600 text-white border-none rounded-xl">
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {productos.map((prod) => (
            <div
              key={prod._id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between p-3 sm:p-4"
            >
              {/* Contenedor de la imagen */}
              <div className="w-full h-44 sm:h-52 bg-base-200/40 dark:bg-gray-800/40 rounded-xl flex items-center justify-center overflow-hidden relative p-3 my-1">
                {prod.imagenUrl && prod.imagenUrl !== 'https://example.com/default.jpg' ? (
                  <img
                    src={prod.imagenUrl}
                    alt={prod.nombre}
                    className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                )}
              </div>

              {/* Información y Precios */}
              <div className="pt-3 flex-1 flex flex-col justify-between border-t border-gray-100 dark:border-gray-800 mt-2">
                <div>
                  {/* TÍTULO DEL PRODUCTO MUCHO MÁS GRANDE (text-lg sm:text-xl lg:text-2xl) */}
                  <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg sm:text-xl lg:text-2xl leading-snug line-clamp-2">
                    {prod.nombre}
                  </h3>
                  <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base sm:text-lg lg:text-xl mt-1.5">
                    US$ {Number(prod.precio).toFixed(2)}
                  </p>
                </div>

                {/* BOTONES EDITAR Y QUITAR EN NEGRITA */}
                <div className="flex gap-1.5 sm:gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => abrirEditar(prod)}
                    className="flex-1 btn btn-xs sm:btn-sm btn-ghost text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-center gap-1 text-xs sm:text-sm font-bold"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(prod._id)}
                    className="flex-1 btn btn-xs sm:btn-sm btn-ghost text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center gap-1 text-xs sm:text-sm font-bold"
                  >
                    <Trash2 className="w-4 h-4" /> Quitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Agregar / Editar Producto */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 text-base-content dark:text-gray-100 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl my-auto border border-gray-200 dark:border-gray-800">
            
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {editId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="btn btn-sm sm:btn-md btn-circle btn-ghost text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pirulín Coco 155g"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input input-bordered input-sm sm:input-md w-full bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Precio (US$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej. 3.50"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="input input-bordered input-sm sm:input-md w-full bg-gray-50 dark:bg-gray-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Foto del producto (Sin fondo)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input file-input-bordered file-input-sm w-full bg-gray-50 dark:bg-gray-800"
                />
                {preview && (
                  <div className="mt-3 flex justify-center bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                    <img
                      src={preview}
                      alt="Vista previa"
                      className="h-28 w-auto object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-sm sm:btn-md btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="btn btn-sm sm:btn-md bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center gap-1 font-bold"
                >
                  <Check className="w-4 h-4" />
                  {enviando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}