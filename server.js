const express = require('express');
const app = express();
const port = 3000;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

// Configura el almacenamiento de archivos con multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Establece la carpeta pública para archivos estáticos
app.use(express.static('public'));

// Define la ruta del archivo de productos
const productosFilePath = 'productos.json';

// Carga los productos desde el archivo JSON
function cargarProductos() {
    try {
        const data = fs.readFileSync(productosFilePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        console.error('Error al cargar productos:', error);
        return [];
    }
}

// Guarda los productos en el archivo JSON
function guardarProductos(productos) {
    try {
        fs.writeFileSync(productosFilePath, JSON.stringify(productos, null, 4), 'utf8');
    } catch (error) {
        console.error('Error al guardar productos:', error);
    }
}

// Ruta de inicio de sesión (GET)
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

// Ruta de inicio de sesión (POST) - Aquí puedes manejar la autenticación
app.post('/login', (req, res) => {
    // Lógica de autenticación aquí
    // ...
    // Después de la autenticación, redirigir al panel correspondiente (usuario o administrador)
    res.redirect('/admin'); // Cambia '/admin' a la ruta deseada
});

// Ruta principal, redirige a la página de inicio de sesión
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Ruta de administrador (GET)
app.get('/admin', (req, res) => {
    const productos = cargarProductos();
    res.render('admin', { productos: productos });
});

// Ruta para agregar un producto (POST)
app.post('/admin/agregar-producto', upload.single('imagen'), (req, res) => {
    // Procesa los datos del formulario para agregar un producto
    const { nombre, descripcion, precio } = req.body;
    const imagen = req.file;

    // Valida que se hayan proporcionado los datos necesarios
    if (!nombre || !descripcion || !precio || !imagen) {
        return res.status(400).send('Por favor, complete todos los campos y adjunte una imagen.');
    }

    // Crea un objeto de producto con los datos recibidos
    const producto = {
        id: Date.now(),
        nombre: nombre,
        descripcion: descripcion,
        precio: parseFloat(precio),
        nombreImagen: imagen.originalname,
    };

    // Guarda la imagen redimensionada
    sharp(imagen.buffer)
        .resize(200, 200)
        .toFile(`public/images/resized/${imagen.originalname}`, (err, info) => {
            if (err) {
                return res.status(500).send('Error al guardar la imagen.');
            }

            // Carga los productos actuales y agrega el nuevo producto
            const productos = cargarProductos();
            productos.push(producto);

            // Guarda los productos en el archivo JSON
            guardarProductos(productos);

            // Redirige nuevamente a la página de administrador después de agregar el producto
            res.redirect('/admin');
        });
});

// Ruta para eliminar un producto (GET)
app.get('/admin/eliminar-producto/:id', (req, res) => {
    const idProducto = req.params.id;
    const productos = cargarProductos();

    // Encuentra el producto por su ID y elimínalo
    const productoAEliminar = productos.find(producto => producto.id === parseInt(idProducto));

    if (!productoAEliminar) {
        return res.status(404).send('Producto no encontrado');
    }

    // Elimina el producto de la lista de productos
    const nuevosProductos = productos.filter(producto => producto.id !== parseInt(idProducto));
    guardarProductos(nuevosProductos);

    // Redirige nuevamente a la página de administrador después de eliminar el producto
    res.redirect('/admin');
});

// Ruta para editar un producto (GET)
app.get('/admin/editar-producto/:id', (req, res) => {
    const idProducto = req.params.id;
    const productos = cargarProductos();

    // Encuentra el producto por su ID
    const productoAEditar = productos.find(producto => producto.id === parseInt(idProducto));

    if (!productoAEditar) {
        return res.status(404).send('Producto no encontrado');
    }

    // Renderiza la vista de edición con los detalles del producto
    res.render('editar-producto', { producto: productoAEditar });
});

// Ruta para guardar la edición de un producto (POST)
app.post('/admin/editar-producto/:id', (req, res) => {
    const idProducto = req.params.id;
    const productos = cargarProductos();

    // Encuentra el producto por su ID
    const productoAEditar = productos.find(producto => producto.id === parseInt(idProducto));

    if (!productoAEditar) {
        return res.status(404).send('Producto no encontrado');
    }

    // Procesa los datos del formulario para editar el producto
    const { nombre, descripcion, precio } = req.body;

    // Actualiza los detalles del producto
    productoAEditar.nombre = nombre;
    productoAEditar.descripcion = descripcion;
    productoAEditar.precio = parseFloat(precio);

    // Procesa la imagen si se cargó una nueva
    if (req.file) {
        const imagePath = path.join(__dirname, 'public/images', req.file.filename);

        // Redimensiona y guarda la imagen con Sharp
        sharp(imagePath)
            .resize(200, 200) // Ajusta el tamaño según tus necesidades
            .toFile(path.join(__dirname, 'public/images/resized', req.file.filename), (err) => {
                if (err) {
                    console.error('Error al redimensionar la imagen:', err);
                } else {
                    console.log('Imagen redimensionada y guardada.');
                }
            });

        // Actualiza la propiedad 'nombreImagen' del producto con el nuevo nombre de archivo
        productoAEditar.nombreImagen = req.file.filename;
    }

    // Guarda los productos actualizados en el archivo JSON
    guardarProductos(productos);

    // Redirige nuevamente a la página de administrador después de editar el producto
    res.redirect('/admin');
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor en ejecución en el puerto ${port}`);
});