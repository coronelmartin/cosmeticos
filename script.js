// CONFIGURACIÓN: Cambia esto por tu número de teléfono real con código de país (sin el +)
const MI_TELEFONO = "595981000000"; 

let todosLosProductos = [];
let carrito = [];
let categoriaActiva = 'todos';
let marcaActiva = 'todas';
let productoActualId = null; // Para saber qué producto está abierto en el modal

const NOMBRES_MARCAS = {
    "oboticario": "O Boticário",
    "gigot": "Gigot",
    "natura": "Natura",
    "marykay": "Mary Kay",
    "avon": "Avon"
};

const NOMBRES_CATEGORIAS = {
    "maquillaje": "Maquillaje",
    "perfumes": "Perfumes",
    "cuidado-facial": "Cuidado Facial",
    "unas": "Uñas",
    "cabello": "Cabello"
};

function obtenerNombreMarca(marcaMinúscula) {
    return NOMBRES_MARCAS[marcaMinúscula] || (marcaMinúscula.charAt(0).toUpperCase() + marcaMinúscula.slice(1));
}

function obtenerNombreCategoria(catMinúscula) {
    return NOMBRES_CATEGORIAS[catMinúscula] || (catMinúscula.replace('-', ' ').charAt(0).toUpperCase() + catMinúscula.replace('-', ' ').slice(1));
}

// 1. Cargar productos desde el JSON
async function cargarProductos() {
    try {
        const respuesta = await fetch('productos.json');
        todosLosProductos = await respuesta.json();
        
        generarFiltrosDeCategorias(); 
        generarFiltrosDeMarcas();     
        aplicarFiltros();
        
        // ¡NUEVO! Verificar si la URL trae un enlace compartido
        verificarEnlaceCompartido();
    } catch (error) {
        console.error("Error cargando productos:", error);
        document.getElementById('lista-productos').innerHTML = "<p>Error al cargar el catálogo.</p>";
    }
}

// Verificar si se abrió la web con un enlace directo (?id=X)
function verificarEnlaceCompartido() {
    const parametros = new URLSearchParams(window.location.search);
    const idProducto = parametros.get('id');
    if (idProducto) {
        openModal(parseInt(idProducto));
    }
}

// Copiar enlace al portapapeles
function compartirProducto() {
    if (!productoActualId) return;
    // Genera un link dinámico tipo: https://tuweb.com
    const urlCompartir = `${window.location.origin}${window.location.pathname}?id=${productoActualId}`;
    
    navigator.clipboard.writeText(urlCompartir).then(() => {
        alert("¡Enlace copiado al portapapeles! Ya puedes enviarlo por WhatsApp.");
    }).catch(err => {
        console.error("Error al copiar enlace: ", err);
    });
}

// Cambiar la foto principal del modal al presionar una miniatura
function cambiarImagenModal(rutaImagen) {
    document.getElementById('modal-imagen').src = rutaImagen;
}

// 2. Generar botones de CATEGORÍAS automáticamente
function generarFiltrosDeCategorias() {
    const contenedorCategorias = document.getElementById('lista-categorias');
    if (!contenedorCategorias) return;

    const categoriasUnicas = [...new Set(todosLosProductos.map(p => p.categoria.toLowerCase().trim()))];
    contenedorCategorias.innerHTML = `<button class="tab-btn cat-btn active" onclick="filterCategory('todos', event)">Todos</button>`;

    categoriasUnicas.forEach(cat => {
        const boton = document.createElement('button');
        boton.className = 'tab-btn cat-btn';
        boton.innerText = obtenerNombreCategoria(cat);
        boton.onclick = (e) => filterCategory(cat, e);
        contenedorCategorias.appendChild(boton);
    });
}

// 3. Generar botones de MARCAS automáticamente
function generarFiltrosDeMarcas() {
    const contenedorMarcas = document.getElementById('lista-marcas');
    if (!contenedorMarcas) return;

    const marcasUnicas = [...new Set(todosLosProductos.map(p => p.marca.toLowerCase().trim()))];
    contenedorMarcas.innerHTML = `<button class="brand-btn active" onclick="filterBrand('todas', event)">Todas</button>`;

    marcasUnicas.forEach(marca => {
        const boton = document.createElement('button');
        boton.className = 'brand-btn';
        boton.innerText = obtenerNombreMarca(marca);
        boton.onclick = (e) => filterBrand(marca, e);
        contenedorMarcas.appendChild(boton);
    });
}

// 4. Mostrar productos en pantalla
function renderizarProductos(productos) {
    const contenedor = document.getElementById('lista-productos');
    contenedor.innerHTML = ""; 

    productos.forEach(prod => {
        const card = document.createElement('div');
        card.className = `product-card ${!prod.stock ? 'sin-stock' : ''}`;
        
        let botonHTML = prod.stock 
            ? `<button class="btn-add" onclick="agregarAlCarrito(${prod.id}, 1)">Añadir al carrito</button>`
            : `<button class="btn-add btn-out" disabled>Agotado temporalmente ❌</button>`;

        card.innerHTML = `
            <div class="product-image" onclick="openModal(${prod.id})">
                <img src="${prod.imagen}" alt="${prod.nombre}">
                <div class="view-details-overlay">Ver detalles</div>
            </div>
            <div class="product-info">
                <span class="brand-label">${obtenerNombreMarca(prod.marca)}</span>
                <h3 onclick="openModal(${prod.id})" style="cursor:pointer;">${prod.nombre}</h3>
                <p class="category">${obtenerNombreCategoria(prod.categoria)}</p>
                <p class="price">Gs. ${prod.precio.toLocaleString('es-ES')}</p>
                ${botonHTML}
            </div>
        `;
        contenedor.appendChild(card);
    });
}

// 5. Filtros
function filterCategory(category, event) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    categoriaActiva = category;
    aplicarFiltros();
}

function filterBrand(brand, event) {
    const buttons = document.querySelectorAll('.brand-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    marcaActiva = brand;
    aplicarFiltros();
}

function aplicarFiltros() {
    let filtrados = todosLosProductos;
    if (categoriaActiva !== 'todos') filtrados = filtrados.filter(p => p.categoria.toLowerCase().trim() === categoriaActiva);
    if (marcaActiva !== 'todas') filtrados = filtrados.filter(p => p.marca.toLowerCase().trim() === marcaActiva);
    renderizarProductos(filtrados);
}

// 6. Ventana Emergente de Detalles (Modal)
function openModal(id) {
    const prod = todosLosProductos.find(p => p.id === id);
    if (!prod) return;

    productoActualId = prod.id; // Guardar ID activo
    document.getElementById('modal-cantidad').value = 1; // Reiniciar selector a 1

    document.getElementById('modal-imagen').src = prod.imagen;
    document.getElementById('modal-imagen').alt = prod.nombre;
    document.getElementById('modal-marca').innerText = obtenerNombreMarca(prod.marca);
    document.getElementById('modal-nombre').innerText = prod.nombre;
    document.getElementById('modal-categoria').innerText = obtenerNombreCategoria(prod.categoria);
    document.getElementById('modal-precio').innerText = `Gs. ${prod.precio.toLocaleString('es-ES')}`;
    document.getElementById('modal-descripcion').innerText = prod.detalles || "No hay descripción disponible.";

    // Renderizar las miniaturas/tonos si existen
    const contenedorMiniaturas = document.getElementById('modal-miniaturas');
    contenedorMiniaturas.innerHTML = "";
    
    if (prod.imagenes_detalles && prod.imagenes_detalles.length > 0) {
        prod.imagenes_detalles.forEach(imgRuta => {
            const thumb = document.createElement('img');
            thumb.src = imgRuta;
            thumb.className = 'thumb-img';
            thumb.onclick = () => cambiarImagenModal(imgRuta);
            contenedorMiniaturas.appendChild(thumb);
        });
    }

    const botonContainer = document.getElementById('modal-boton-container');
    const accionesContainer = document.getElementById('modal-acciones-container');
    
    if (prod.stock) {
        accionesContainer.style.display = "flex";
        botonContainer.innerHTML = `<button class="btn-add" onclick="agregarAlCarritoDesdeModal()">Añadir al carrito</button>`;
    } else {
        accionesContainer.style.display = "none";
        botonContainer.innerHTML = `<button class="btn-add btn-out" disabled>Agotado temporalmente</button>`;
    }

    document.getElementById('product-modal').classList.add('open');
}

function agregarAlCarritoDesdeModal() {
    const cantidadSeleccionada = parseInt(document.getElementById('modal-cantidad').value) || 1;
    agregarAlCarrito(productoActualId, cantidadSeleccionada);
    closeModal();
}

function closeModal() {
    document.getElementById('product-modal').classList.remove('open');
    productoActualId = null;
    // Limpiar el parámetro de la URL sutilmente sin recargar
    window.history.replaceState({}, document.title, window.location.pathname);
}

// 7. Gestión de Carrito
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
}

function agregarAlCarrito(id, cantidad = 1) {
    const producto = todosLosProductos.find(p => p.id === id);
    const existe = carrito.find(item => item.id === id);

    if (existe) {
        existe.cantidad += cantidad;
    } else {
        carrito.push({ ...producto, cantidad: cantidad });
    }
    actualizarInterfazCarrito();
    document.getElementById('cart-sidebar').classList.add('open');
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    actualizarInterfazCarrito();
}

function actualizarInterfazCarrito() {
    const contador = document.getElementById('contador-carrito');
    const listaHTML = document.getElementById('items-carrito');
    const totalHTML = document.getElementById('total-precio');
    
    let totalCantidad = 0;
    let totalPrecio = 0;
    listaHTML.innerHTML = "";

        carrito.forEach(item => {
        totalCantidad += item.cantidad;
        totalPrecio += (item.precio * item.cantidad);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div>
                <h4>${item.nombre}</h4>
                <small>Gs. ${item.precio.toLocaleString('es-ES')} x ${item.cantidad}</small>
            </div>
            <button class="remove-btn" onclick="eliminarDelCarrito(${item.id})">🗑️</button>
        `;
        listaHTML.appendChild(itemDiv);
    });

    contador.innerText = totalCantidad;
    totalHTML.innerText = `Gs. ${totalPrecio.toLocaleString('es-ES')}`;
}

// 8. Enviar pedido por WhatsApp
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    let mensaje = "¡Hola AURA! Me gustaría realizar el siguiente pedido:\n\n";
    let total = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        mensaje += `• ${item.nombre} (x${item.cantidad}) - Gs. ${subtotal.toLocaleString('es-ES')}\n`;
        total += subtotal;
    });

    mensaje += `\n*Total a pagar: Gs. ${total.toLocaleString('es-ES')}*`;
    
    const url = `https://wa.me{MI_TELEFONO}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// Iniciar la carga del catálogo
cargarProductos();
