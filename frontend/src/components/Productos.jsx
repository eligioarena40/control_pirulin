import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, X, Check } from 'lucide-react';
import api from '../services/api';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el formulario (Agregar / Editar)
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Cargar productos desde el backend al entrar
  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/productos');
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

  // Abrir formulario limpio para crear
  const abrirCrear = () => {
    setEditId(null);
    setNombre('');
    setPrecio('');
    setImagen(null);
    setPreview(null);
    setModalOpen(true);
  };

  // Abrir formulario con datos para editar
  const abrirEditar = (prod) => {
    setEditId(prod._id);
    setNombre(prod.nombre);
    setPrecio(prod.precio);
    setImagen(null);
    setPreview(prod.imagenUrl || null); // <-- Usamos imagenUrl
    setModalOpen(true);
  };

  // Manejar selección de imagen local
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Guardar (Crear o Actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !precio) return;

    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('precio', precio);
      
      if (imagen) {
        // Probamos con 'imagen'. Si tu multer usa otro nombre, cámbialo aquí ('foto' o 'file')
        formData.append('imagen', imagen); 
      }

      if (editId) {
        await api.put(`/productos/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/productos', formData, {
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

  // Eliminar producto
  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas quitar este producto del catálogo?')) return;
    try {
      await api.delete(`/productos/${id}`);
      fetchProductos();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Encabezado y Botón Agregar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h2>
          <p className="text-sm text-gray-500">Agrega, edita o quita productos disponibles</p>
        </div>
        <button
          onClick={abrirCrear}
          className="btn bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center gap-2 rounded-xl px-4 py-2 shadow"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Cuadrícula de Tarjetas */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando catálogo...</div>
      ) : productos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-3">Aún no hay productos registrados en el catálogo.</p>
          <button onClick={abrirCrear} className="btn btn-sm bg-amber-600 text-white border-none">
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productos.map((prod) => (
            <div
              key={prod._id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              {/* Imagen del producto */}
              <div className="h-44 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                {prod.imagenUrl && prod.imagenUrl !== 'https://example.com/default.jpg' ? (
                  <img
                    src={prod.imagenUrl}
                    alt={prod.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                )}
              </div>

              {/* Nombre y Precio */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">{prod.nombre}</h3>
                  <p className="text-emerald-600 font-extrabold text-xl mt-1">
                    US$ {Number(prod.precio).toFixed(2)}
                  </p>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => abrirEditar(prod)}
                    className="flex-1 btn btn-sm btn-ghost text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(prod._id)}
                    className="flex-1 btn btn-sm btn-ghost text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 border-b z-10">
              <h3 className="text-xl font-bold text-gray-800">
                {editId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pirulín Coco 155g"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input input-bordered w-full bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (US$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej. 3.50"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="input input-bordered w-full bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto del producto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input file-input-bordered file-input-sm w-full bg-gray-50"
                />
                {preview && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={preview}
                      alt="Vista previa"
                      className="h-32 w-auto object-cover rounded-xl border"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="btn bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center gap-1"
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