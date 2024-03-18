const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const esquema = require('../models/usuarios')

const router = express.Router()

// Endpoint de inicio de sesión
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Endpoint para solicitar recuperación de contraseña
router.post("/usuarios/recuperar-contraseña", async (req, res) => {
    try {
      const { correo } = req.body;
  
      // Verificar si el usuario existe en la base de datos
      const usuario = await esquema.findOne({ correo });
      if (!usuario) {
        return res.status(404).json({ error: "El usuario no existe" });
      }
  
      // Generar un token único y seguro para la recuperación de contraseña
      const token = jwt.sign({ userId: usuario._id }, "contraseñaToken", {
        expiresIn: "1h",
      });
  
      // Enviar correo electrónico con el enlace de recuperación de contraseña
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "20221135@uthh.edu.mx",
          pass: "uthhtic23",
        },
      });
  
      const mailOptions = {
        from: "20221135@uthh.edu.mx",
        to: correo,
        subject: "Recuperación de Contraseña",
        html: `
                  <p>Hola ${usuario.nombre},</p>
                  <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
                  <a href="http://localhost:3000/recuperarpassword?token=${token}">Restablecer contraseña</a>
              `,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error al enviar correo electrónico:", error);
          return res
            .status(500)
            .json({ message: "Error al enviar correo electrónico" });
        }
        console.log("Correo de recuperación enviado:", info.response);
        res.status(200).json({ message: "Correo de recuperación enviado" });
      });
    } catch (error) {
      res.status(500).send("Error en el servidor");
    }
  });
  
  // Endpoint para restablecer contraseña con el token
  router.post("/usuarios/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
  
      // Verificar y decodificar el token
      const decoded = jwt.verify(token, "contraseñaToken");
      const userId = decoded.userId;
  
      // Actualizar la contraseña del usuario en la base de datos
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await esquema.findByIdAndUpdate(userId, { contraseña: hashedPassword });
  
      res.status(200).json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      res.status(400).json({ message: "Token inválido o expirado" });
    }
  });



module.exports = router