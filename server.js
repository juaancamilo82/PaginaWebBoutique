const express = require('express');
const app = express();
const port = 3000;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp'); // Importa la biblioteca sharp
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false })); // Configurar body-parser para analizar el cuerpo de las solicitudes POST
const productosFilePath = 'productos.json';
let productos = cargarProductos();
if (!Array.isArray(productos)) {
    // Si no es un arreglo, inicialízalo como un arreglo vacío
    productos = [];
}
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));


// ---------end point para cargar los productos en /admin------------------------------------//


app.get('/admin', (req, res) => {
    // Carga la lista de productos desde el archivo JSON


    // Genera el contenido HTML para la lista de productos
    let productListHTML = '<ul>';
    productos.forEach(producto => {
        productListHTML += `


      <li class="product">
        <img src="/images/resized/${producto.nombreImagen}" alt="${producto.nombre}">
        <h3>${producto.nombre}</h3>
        <p>${producto.descripcion}</p>
        <p>Precio: $${producto.precio}</p>
        <button>Editar</button> 
        <button>Eliminar</button>
      </li>`;;
    });
    productListHTML += '</ul>';

    // Envía el contenido HTML como respuesta al navegador
    res.send(`
    <html>
      <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administrador</title>
    <link rel="stylesheet" href="/css/stylesAdmin.css">
</head>
      <body>
<h1>Panel de Administrador</h1>



    <form action="/admin/agregar-producto" method="POST" enctype="multipart/form-data" >
        <!-- Campos del formulario para el nuevo producto -->
        <h2>Agregar Producto</h2>
        <label for="nombre">Nombre del Producto:</label>
  <input type="text" id="nombre" name="nombre" required>

  <label for="descripcion">Descripción:</label>
  <textarea id="descripcion" name="descripcion" rows="4" required></textarea>

  <label for="precio">Precio:</label>
  <input type="number" id="precio" name="precio" required>

  <label for="imagen">Imagen del Producto:</label>
  <input type="file" id="imagen" name="imagen" accept="image/*" max-size="1048576" required>
 <!-- Añade "required" para asegurar que se incluya la imagen -->


        <button type="submit">Agregar Producto</button>



    </form>
        ${productListHTML} <!-- Inserta la lista de productos generada aquí -->
        
      </body>
    </html>
  `);
});

// ---------------------------------------------------------------------------------------------------//

// ---------------------------------------------------------
// Ruta de inicio de sesión (GET)
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

// Ruta de inicio de sesión (POST) - Aquí puedes manejar la autenticación
app.post('/login', (req, res) => {
    // Lógica de autenticación aquí
    // ...
    // Después de la autenticación, redirigir al panel correspondiente (usuario o administrador)
    res.redirect('/dashboard'); // Cambia '/dashboard' a la ruta deseada
});

// ...

// Ruta principal redirige a la página de inicio de sesión
app.get('/', (req, res) => {
    res.redirect('/login');
});


app.listen(port, () => {
    console.log(`Servidor en ejecución en el puerto ${port}`);
});

app.use(express.static('public', {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Ruta de registro (GET)
app.get('/registro', (req, res) => {
    res.sendFile(__dirname + '/views/registro.html');
});

// Ruta de registro (POST) - Maneja la creación de usuarios
app.post('/registro', (req, res) => {
    const { username, password } = req.body;

    // Aquí debes implementar la lógica para registrar al usuario en tu base de datos
    // Ejemplo: Insertar el usuario en la base de datos
    // ...

    // Después de registrar al usuario, redirige a la página de inicio de sesión
    res.redirect('/login'); // Cambia '/login' a la ruta correcta de inicio de sesión
});

// Ruta del panel de administrador
app.get('/admin', (req, res) => {
    // Verifica si el usuario es un administrador (implementa tu lógica aquí)
    const esAdmin = true; // Cambia esto según tu lógica

    if (esAdmin) {
        res.sendFile(__dirname + '/views/admin.html');
    } else {
        res.status(403).send('Acceso no autorizado'); // Si no es administrador, devuelve un error 403
    }
});


// -----------------------------------------------//





// --------------------------- end point para agregar productos ------------ //


// Función para cargar productos desde el archivo JSON
function cargarProductos() {
    try {
        const data = fs.readFileSync(productosFilePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        console.error('Error al cargar productos:', error);
        return [];
    }
}


//  ------------ Función para guardar productos en el archivo JSON ------



function guardarProductos(productos) {
    try {
        const data = JSON.stringify(productos, null, 2);
        fs.writeFileSync(productosFilePath, data, 'utf8');
    } catch (error) {
        console.error('Error al guardar productos:', error);
    }
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directorio de destino para las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nombre de archivo único
    },
});

// Middleware para cargar imágenes
const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 }, // Límite de tamaño en bytes (500 KB)
});




app.post('/admin/agregar-producto', upload.single('imagen'), async (req, res) => {

    const nombreProducto = req.body.nombre;
    const nombreImagen = req.file.filename; // Obtén el nombre de la imagen

    if (!nombreProducto || !nombreImagen) {
        return res.status(400).send('Faltan datos obligatorios.');
    }

    // Redimensiona la imagen antes de guardarla
    if (req.file) {
        const imagePath = path.join(__dirname, 'public', 'images', req.file.filename);
        const outputPath = path.join(__dirname, 'public', 'images', 'resized', req.file.filename); // Ruta para la imagen redimensionada

        await sharp(imagePath)
            .resize(300, 300) // Ajusta el tamaño máximo deseado
            .toFile(outputPath); // Guarda la imagen redimensionada en una ruta diferente
    }


    // Acceder a la información de la imagen cargada
    // const nombreImagen = req.file.filename; // Nombre del archivo de imagen

    // Obtén los datos del nuevo producto desde el cuerpo de la solicitud


    console.log('Datos enviados en req.body:', JSON.stringify(req.body, null, 2));
    console.log('Nombre de la imagen:', nombreImagen);

    const {nombre, descripcion, precio, imagen} = req.body;

    if (!nombre || !descripcion || !precio) {
        return res.status(400).send('Faltan datos obligatorios.');
    }


    // Crea un nuevo objeto de producto
    const nuevoProducto = {
        nombre,
        descripcion,
        precio,
        nombreImagen,
    };

    console.log('Nuevo producto 1:', nuevoProducto);

    try {
        productos.push(nuevoProducto);
        guardarProductos(productos);
    } catch (error) {
        console.error('Error al agregar producto:', error);
    }

    // Redirige nuevamente al panel de administrador después de agregar el producto
    res.redirect('/admin');
});








// ----------------------------------------------------------------------------//






// Rutas para editar y eliminar productos (implementa según tus necesidades)
