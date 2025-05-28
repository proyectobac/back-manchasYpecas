import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaSearch } from 'react-icons/fa';
import ProductoService from '../../services/productosService';
import defaultProductImage from '../../assets/images/login1.jpg';

const TiendaCliente = () => {
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categorias = [
    { id: 'TODOS', nombre: 'Todos los Productos', imagen: defaultProductImage },
    { id: 'SNACKS', nombre: 'Snacks', imagen: '/imagenes/Snacks/banner-snacks.jpg' },
    { id: 'HIGIENE', nombre: 'Aseo', imagen: '/imagenes/Aseo/banner-aseo.jpg' },
    { id: 'JUGUETERIA', nombre: 'Juguetes', imagen: '/imagenes/Juguetes/banner-juguetes.jpg' },
    { id: 'ACCESORIOS', nombre: 'Accesorios', imagen: '/imagenes/Accesorios/banner-accesorios.jpg' },
    { id: 'COMEDEROS', nombre: 'Comederos', imagen: '/imagenes/Comederos/banner-comederos.jpg' }
  ];

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const response = await ProductoService.getAllProductos();
      // Filtrar solo productos activos
      const productosActivos = response.productos.filter(p => p.estado === 'Activo');
      setProductos(productosActivos);
    } catch (err) {
      setError('Error al cargar los productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(producto => {
    const cumpleFiltroCategoria = categoriaSeleccionada === 'TODOS' || producto.categoria === categoriaSeleccionada;
    const cumpleBusqueda = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    return cumpleFiltroCategoria && cumpleBusqueda;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchProductos}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Barra de búsqueda */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Categorías */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoriaSeleccionada(cat.id)}
            className={`relative overflow-hidden rounded-lg shadow-md transition-transform hover:scale-105 
              ${categoriaSeleccionada === cat.id ? 'ring-2 ring-blue-500' : ''}`}
          >
            <img
              src={cat.imagen}
              alt={cat.nombre}
              className="w-full h-24 object-cover"
              onError={(e) => {e.target.src = defaultProductImage}}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <span className="text-white font-semibold text-sm md:text-base">
                {cat.nombre}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {productosFiltrados.map((producto) => (
          <div
            key={producto.id_producto}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative pb-[100%]">
              <img
                src={producto.foto || defaultProductImage}
                alt={producto.nombre}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {e.target.src = defaultProductImage}}
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                {producto.nombre}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {producto.descripcion || 'Sin descripción'}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-600">
                  {formatPrice(producto.precioVenta)}
                </span>
                <button
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  onClick={() => {/* Implementar lógica del carrito */}}
                >
                  <FaShoppingCart />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay productos */}
      {productosFiltrados.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron productos</p>
        </div>
      )}
    </div>
  );
};

export default TiendaCliente; 