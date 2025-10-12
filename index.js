const express = require("express");
const path = require("path");

const mysql = require("mysql");

const app = express();


const ADMIN_CODE = "admin"; 
const ALUMNADO_CODE = "alumnado"; 
const ROL_ALUMNO_ID = 3; 
const ROL_ALUMNADO_ID = 2; 
const ROL_ADMIN_ID = 1; 

//Conexion con base de datos
let conexion = mysql.createConnection({
    host: "localhost",
    database: "boletin-Digital", 
    user: "root",
    password: ""
});

conexion.connect(function(err) {
    if (err) {
        console.error('Error al conectar a la base de datos: ' + err.stack);
        return; 
    }
    console.log('Conectado a la base de datos' + conexion.threadId);
});

const rootDir = __dirname; 

// Procesador del body
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// declaracion de archivos estaticos
app.use(express.static(path.join(rootDir,'Vistas-html'))); 
app.use(express.static(path.join(rootDir,'Imagenes'))); 


app.get("/", function(req, res) {
    res.sendFile(path.join(rootDir, "Vistas-html", "VistaPrincipal", "vistaPrincipal.html"));
});

app.post("/validar", function(req, res) { 
    
    const datos = req.body;
    
    let nombre = datos.nombre;
    let apellido = datos.apellido;
    let email = datos.correo;
    let contrasena = datos.pass;
    
    const rolSeleccionado = datos.rol; 
    const codigoEspecial = datos['special-code']; 

    let id_rol_a_guardar;
    let registroPermitido = true;

    if (rolSeleccionado === 'admin') {
    if (codigoEspecial === ADMIN_CODE) {
            id_rol_a_guardar = ROL_ADMIN_ID;
        } else {
            registroPermitido = false;
            return res.send('Código de administrador incorrecto. <a href="/registrarse.html">Volver</a>');
        }
    } else if (rolSeleccionado === 'alumnado') {
        if (codigoEspecial === ALUMNADO_CODE) {
            id_rol_a_guardar = ROL_ALUMNADO_ID;
        } else {
            registroPermitido = false;
            return res.send('Código de departamento incorrecto. <a href="/registrarse.html">Volver</a>');
        }
    } else {
    
        id_rol_a_guardar = ROL_ALUMNO_ID;
    }

    if (registroPermitido) {
        let registrar = "INSERT INTO usuarios (nombre, apellido, email, contrasena, id_rol) VALUES (?, ?, ?, ?, ?)";
        
        conexion.query(registrar, [nombre, apellido, email, contrasena, id_rol_a_guardar], function(err, result) {
            if (err) {
                console.error('Error al registrar usuario: ', err);
    
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.send('Ese email ya está registrado. <a href="/registrarse.html">Volver</a>');
                }
                return res.send(`Error en la base de datos: ${err.sqlMessage} <a href="/registrarse.html">Volver</a>`); 
            }
            
            console.log('Usuario registrado con ID: ' + result.insertId + ' y Rol ID: ' + id_rol_a_guardar);
            
            res.redirect("/Login/login.html"); 
        });
    }
});

app.post("/login-auth", function(req, res) {
    
    const { email, contrasena, rol, specialcode } = req.body; 
    
    let codigoEsperado = null;
    if (rol === 'admin') codigoEsperado = ADMIN_CODE;
    if (rol === 'alumnado') codigoEsperado = ALUMNADO_CODE;

    if (codigoEsperado !== null && specialcode !== codigoEsperado) {
        return res.send("Código incorrecto para el rol. <a href='/login.html'>Volver</a>"); 
    }
    
    let query = "SELECT id_usuario, id_rol FROM usuarios WHERE email = ? AND contrasena = ?";
    
    conexion.query(query, [email, contrasena], function(err, results) {
        if (err) {
            console.error('Error en la consulta de login: ', err);
            return res.send(`Error de servidor: ${err.sqlMessage}`); 
        }

    
        if (results.length === 0) {
            return res.send("Credenciales incorrectas (Email o Contraseña). <a href='/Login/login.html'>Volver</a>"); 
        }

    
        const user = results[0];
        const db_rol = user.id_rol; 


        switch (db_rol) {
            case ROL_ADMIN_ID:
                return res.redirect("/Admin/admin.html");
            case ROL_ALUMNADO_ID:
                return res.redirect("/DepartamentoAlumnado/Departamento.html");
            case ROL_ALUMNO_ID:
                return res.redirect("/Alumno/alumno.html");
            default:
                return res.send("Rol de usuario no reconocido. <a href='/Login/login.html'>Volver</a>");
        }
    });
});
app.listen(3000, function(){
    console.log("servidor creado http://localhost:3000");
})