const express = require('express');
const app = express();
const port = 3000;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Importa el módulo uuid
const sharp = require('sharp');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración de multer para el manejo de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Función para cargar productos desde el archivo JSON
function cargarProductos() {
    try {
        const data = fs.readFileSync('productos.json', 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        console.error('Error al cargar productos:', error);
        return [];
    }
}

// Función para guardar productos en el archivo JSON
function guardarProductos(productos) {
    fs.writeFileSync('productos.json', JSON.stringify(productos, null, 2), 'utf8');
}

// Ruta principal
app.get('/', (req, res) => {
    res.redirect('/admin');
});

// Ruta de administrador para ver, agregar, editar y eliminar productos
app.get('/admin', (req, res) => {
    const productos = cargarProductos();
    res.render('admin', { productos });
});

// Ruta para agregar producto (POST)
app.post('/admin/agregar-producto', upload.single('imagen'), (req, res) => {

    const productos = cargarProductos();
    const { nombre, descripcion, precio } = req.body;
    // Procesa los datos del formulario para agregar un producto
    const imagen = req.file;
    const nombreImagenUnico = `${uuidv4()}_${imagen.originalname}`;


    // Valida que se hayan proporcionado los datos necesarios
    if (!nombre || !descripcion || !precio || !imagen) {
        return res.status(400).send('Por favor, complete todos los campos y adjunte una imagen.');
    }

    // Crea un nuevo producto
    const nuevoProducto = {
        id: Date.now(), // Genera un ID único usando la fecha y hora actual
        nombre,
        descripcion,
        precio: parseFloat(precio),
    };

    if (req.file) {
        // Procesa la imagen si se adjunta una
        const imagenPath = `public/images/uploads/${req.file.filename}`;
        const imagenResizedPath = `public/images/resized/${req.file.filename}`;
    }

        // Guarda la imagen redimensionada con el nuevo nombre único
        sharp(imagen.buffer)
            .resize(200, 200)
            .toFile(`public/images/resized/${nombreImagenUnico}`, (err, info) => {
                if (err) {
                    console.error('Error al procesar la imagen:', err);
                    return res.status(500).send('Error al guardar la imagen.');
                }
                console.log('Información de la imagen procesada:', info);

                // Actualiza la propiedad 'nombreImagen' del producto con el nuevo nombre de archivo
                productoAEditar.nombreImagen = nombreImagenUnico;

                // Redirige nuevamente a la página de administrador después de agregar el producto
                res.redirect(`/admin?random=${Math.random()}`); // Agrega un parámetro de consulta aleatorio

            });

        nuevoProducto.nombreImagen = req.file.filename;

    // Agrega el nuevo producto a la lista de productos
    productos.push(nuevoProducto);

    // Guarda la lista de productos actualizada
    guardarProductos(productos);

    res.redirect('/admin');

});

// Ruta para editar producto (GET)
app.get('/admin/editar-producto/:id', (req, res) => {
    const idProducto = req.params.id;
    const productos = cargarProductos();
    const productoAEditar = productos.find(
        (producto) => producto.id === parseInt(idProducto)
    );

    if (!productoAEditar) {
        return res.status(404).send('Producto no encontrado');
    }

    res.render('editar-producto', { producto: productoAEditar });
});

// Ruta para guardar la edición de un producto (POST)
app.post('/admin/editar-producto/:id', upload.single('imagen'), (req, res) => {
    const idProducto = req.params.id;
    const productos = cargarProductos();
    const productoAEditar = productos.find(
        (producto) => producto.id === parseInt(idProducto)
    );

    if (!productoAEditar) {
        return res.status(404).send('Producto no encontrado');
    }

    const { nombre, descripcion, precio } = req.body;

    // Actualiza los detalles del producto
    productoAEditar.nombre = nombre;
    productoAEditar.descripcion = descripcion;
    productoAEditar.precio = parseFloat(precio);

    if (req.file) {
        // Procesa la imagen si se adjunta una
        const imagenPath = `public/images/uploads/${req.file.filename}`;
        const imagenResizedPath = `public/images/resized/${req.file.filename}`;

        sharp(imagenPath)
            .resize(200, 200)
            .toFile(imagenResizedPath, (err) => {
                if (err) {
                    console.error('Error al redimensionar la imagen:', err);
                } else {
                    console.log('Imagen redimensionada con éxito.');
                }
            });

        productoAEditar.nombreImagen = req.file.filename;
    }

    // Guarda los productos actualizados en el archivo JSON
    guardarProductos(productos);

    res.redirect('/admin');

});

// Ruta para eliminar producto (GET)
app.get('/admin/eliminar-producto/:id', (req, res) => {
    const idProducto = req.params.id;
    const productos = cargarProductos();
    const productoAEliminar = productos.find(
        (producto) => producto.id === parseInt(idProducto)
    );

    if (!productoAEliminar) {
        return res.status(404).send('Producto no encontrado');
    }

    // Elimina el producto de la lista de productos
    const nuevosProductos = productos.filter(
        (producto) => producto.id !== parseInt(idProducto)
    );
    guardarProductos(nuevosProductos);


    res.redirect('/admin');
});

app.listen(port, () => {
    console.log(`Servidor en ejecución en el puerto ${port}`);
});

