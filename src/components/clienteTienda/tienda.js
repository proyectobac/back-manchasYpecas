// Configuración
const API_URL = 'http://localhost:3001/api';

// Elementos del DOM
let productosContainer;
let categoriasContainer;
let searchInput;
let categoriaActual = 'TODOS';

// Función para inicializar la aplicación
async function initApp() {
    // Obtener referencias a elementos del DOM
    productosContainer = document.getElementById('productos-container');
    categoriasContainer = document.getElementById('categorias-container');
    searchInput = document.getElementById('search-input');

    // Configurar eventos
    searchInput?.addEventListener('input', filtrarProductos);
    
    // Cargar productos
    await cargarProductos();
}

// Función para cargar productos desde el API
async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/imagenes/productos-imagenes`);
        const data = await response.json();
        
        if (data.success) {
            // Almacenar productos en el estado global
            window.todosLosProductos = data.productos;
            
            // Renderizar categorías
            renderizarCategorias();
            
            // Renderizar productos
            renderizarProductos();
        } else {
            mostrarError('Error al cargar los productos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al conectar con el servidor');
    }
}

// Función para renderizar categorías
function renderizarCategorias() {
    if (!categoriasContainer) return;

    const categorias = [
        { id: 'TODOS', nombre: 'Todos los Productos' },
        { id: 'SNACKS', nombre: 'Snacks' },
        { id: 'HIGIENE', nombre: 'Aseo' },
        { id: 'JUGUETERIA', nombre: 'Juguetes' },
        { id: 'ACCESORIOS', nombre: 'Accesorios' }
    ];

    categoriasContainer.innerHTML = categorias.map(cat => `
        <button 
            class="categoria-btn ${categoriaActual === cat.id ? 'active' : ''}"
            data-categoria="${cat.id}"
            onclick="cambiarCategoria('${cat.id}')"
        >
            ${cat.nombre}
        </button>
    `).join('');
}

// Función para cambiar categoría
function cambiarCategoria(categoria) {
    categoriaActual = categoria;
    renderizarCategorias();
    renderizarProductos();
}

// Función para filtrar productos
function filtrarProductos() {
    renderizarProductos();
}

// Función para renderizar productos
function renderizarProductos() {
    if (!productosContainer || !window.todosLosProductos) return;

    const searchTerm = searchInput?.value.toLowerCase() || '';
    let productosFiltrados = [];

    // Obtener todos los productos de todas las categorías
    if (categoriaActual === 'TODOS') {
        Object.values(window.todosLosProductos).forEach(productos => {
            productosFiltrados = [...productosFiltrados, ...productos];
        });
    } else {
        productosFiltrados = window.todosLosProductos[categoriaActual] || [];
    }

    // Aplicar filtro de búsqueda
    productosFiltrados = productosFiltrados.filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm) ||
        (producto.descripcion || '').toLowerCase().includes(searchTerm)
    );

    // Renderizar productos
    productosContainer.innerHTML = productosFiltrados.map(producto => `
        <div class="producto-card">
            <img 
                src="${API_URL}${producto.foto}" 
                alt="${producto.nombre}"
                onerror="this.src='assets/default-product.jpg'"
            >
            <div class="producto-info">
                <h3>${producto.nombre}</h3>
                <p>${producto.descripcion || 'Sin descripción'}</p>
                <div class="producto-footer">
                    <span class="precio">$${producto.precioVenta.toLocaleString()}</span>
                    <button onclick="agregarAlCarrito(${producto.id_producto})" class="btn-carrito">
                        Agregar al carrito
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Función para mostrar errores
function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-mensaje';
    errorDiv.textContent = mensaje;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Función para agregar al carrito (implementar según necesidades)
function agregarAlCarrito(idProducto) {
    console.log('Agregar al carrito:', idProducto);
    // Implementar lógica del carrito
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp); 