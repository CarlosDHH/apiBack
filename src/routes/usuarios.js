const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer');

const esquema = require('../models/usuarios')

const router = express.Router()

//agregue dos endpoints para control de dispositivos por id 


//Endpoint para asignar Dispositivos

router.put('/usuarios/:userId/dispositivo/:dispositivoId', async (req, res) => {
    const { userId, dispositivoId } = req.params;

    try {
        // Encuentra el usuario y añade el dispositivoId al array de dispositivos
        await esquema.findByIdAndUpdate(userId, {
            $addToSet: { dispositivos: dispositivoId } // Usa $addToSet para evitar duplicados
        }, { new: true }).populate('dispositivos'); // Opcional: devuelve el usuario con los dispositivos poblados

        res.json({ message: 'Dispositivo asignado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al asignar el dispositivo.' });
    }
});


//EndPoint para listar Dispositivos de un usuario 

router.get('/usuarios/:userId/dispositivos', async (req, res) => {
    const { userId } = req.params;

    try {
        const usuario = await esquema.findById(userId).populate('dispositivos');
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }
        res.json(usuario.dispositivos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los dispositivos.' });
    }
});

// Endpoint de inicio de sesión
router.get('/usuarios/perfil', async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]; // Asume que el token viene en el encabezado Authorization como "Bearer <token>"
        const decoded = jwt.verify(token, 'tuSecretKey'); // Usa la misma clave secreta que usaste para firmar el token
        const usuario = await esquema.findById(decoded._id); // Busca el usuario por el ID decodificado del token

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(usuario); // Devuelve el usuario encontrado
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

router.post('/usuarios/login', async (req, res) => {
    try {
        const usuario = await esquema.findOne({ correo: req.body.correo });
        if (!usuario) {
            return res.status(404).json({ error: "Usuario incorrecto" });
        }

        const contraseñaValida = await esquema.findOne({ contraseña: req.body.contraseña });
        const pass = contraseñaValida;
        if (!contraseñaValida) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }


        const token = jwt.sign(
            { _id: usuario._id, tipo: usuario.tipo },
            'tuSecretKey',
            { expiresIn: '24h' }
        );
        res.json({
            token,
            user: {
                _id: usuario._id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                tipo: usuario.tipo,
                // Puedes agregar más campos según necesites
            }
        });
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }

    //     res.json({ token });
    // } catch (error) {
    //     res.status(500).send('Error en el servidor');
    // }
});


router.get('/usuarios/x', (req, res) => {
    res.json({ "response": "Prueba Users" })
})

router.post('/usuarios', (req, res) => {
    const us = esquema(req.body);
    us.save()
        .then(data => res.json(data))
        .catch(error => res.json({ message: error }))
})

//leer usuarios
router.get('/usuarios', (req, res) => {
    esquema.find()
        .then(data => res.json(data))
        .catch(error => res.json({ message: error }))
})

//buscar usuario
router.get('/usuarios/:id', (req, res) => {
    const { id } = req.params
    esquema.findById(id)
        .then(data => res.json(data))
        .catch(error => res.json({ message: error }))
})

//busqueda por elmail
router.get('/usuarios/correo/:correo', (req, res) => {
    const { correo } = req.params
    esquema.findOne({ correo })
        .then(data => res.json(data))
        .catch(error => res.json({ message: error }))
})


//actualizar usuario
router.put('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, correo, contraseña, telefono, tipo, preguntaRecuperacion, respuestaPregunta, codigoRecuperacion, dispositivo } = req.body
    esquema
        .updateOne({ _id: id }, { $set: { nombre, apellido, correo, contraseña, telefono, tipo, preguntaRecuperacion, respuestaPregunta, codigoRecuperacion, dispositivo } })
        .then((data) => res.json(data))
        .catch((error) => res.json({ message: error }))
})

//eliminar usuario
router.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    esquema.deleteOne({ _id: id })
        .then(data => res.json(data))
        .catch(error => res.json({ message: error }))
})

//Valido para recuperar contraseña, de aqui para arriba no modificar nada, ya todo funciona


// Configuración del transportador de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "proyeqtocuatri@gmail.com",
        pass: "proyequi1254",
    },
});

// Endpoint para solicitar recuperación de contraseña
// Endpoint para solicitar recuperación de contraseña
router.post('/usuarios/solicitar-recuperacion', async (req, res) => {
    const { correo } = req.body;
    const usuario = await esquema.findOne({ correo });

    if (!usuario) {
        return res.status(404).json({ error: 'No se encontró un usuario con ese correo electrónico.' });
    }

    // Generación del token de recuperación
    const tokenRecuperacion = jwt.sign(
        { _id: usuario._id },
        'contraseñapass1234', // Aquí deberías usar process.env.JWT_SECRET_RECUPERACION
        { expiresIn: '1h' }
    );

    // URL de recuperación de contraseña
    const enlaceRecuperacion = `http://localhost:3000/registrarse/recuperar-contrasena/${tokenRecuperacion}`;

    // Configuración del correo electrónico
    const mailOptions = {
        from: 'proyeqtocuatri@gmail.com', // Aquí deberías usar process.env.EMAIL_USERNAME
        to: correo,
        subject: 'Recuperación de Contraseña',
        html: `<p>Hola ${usuario.nombre},</p>
                <p>Has solicitado restablecer tu contraseña. Por favor, sigue el siguiente enlace para establecer una nueva:</p>
                <a href="${enlaceRecuperacion}">Restablecer contraseña</a>`,
    };

    // Envío del correo electrónico
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return res.status(500).json({ error: 'Error al enviar el correo electrónico.' });
        } else {
            res.json({ message: 'Se ha enviado un correo electrónico con las instrucciones para restablecer tu contraseña.' });
        }
    });
});


module.exports = router

// process.env.JWT_SECRET_RECUPERACION
// process.env.EMAIL_USERNAME