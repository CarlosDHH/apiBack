const express = require('express')
const esquema = require('../models/dispositivo')

const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io:1883');
const routerd = express.Router()

client.on('connect', () => {
    client.subscribe('dispensador/01/estado', (err) => {
        if (!err) {
            console.log("Subscrito con éxito al topic del estado del dispensador");
        }
    });
});

client.on('message', (topic, message) => {
    // Suponiendo que el topic es "dispensador/estado"
    if (topic === "dispensador/01/estado") {
        const estado = JSON.parse(message.toString()); // Parsea el mensaje a JSON
        const dispositivoId = "65fd3f2f52b794079f541595"; // Asumiendo un ID de dispositivo fijo para el ejemplo

        // Actualizar la base de datos con los nuevos estados
        esquema.updateOne({_id: dispositivoId}, {$set: { 
            led: estado.led,
            pesoAlimento: estado.pesoAlimento,
            pesoAgua: estado.pesoAgua,
            nivelAlimento: estado.nivelAlimento,
            nivelAgua: estado.nivelAgua,
            botonAlimento: estado.botonAlimento
        }})
        .then(result => console.log("Actualización exitosa", result))
        .catch(error => console.error("Error al actualizar el dispositivo", error));
    }
});

routerd.get('/dispositivo/prueba', (req, res) => {
    res.json({ "response": "Prueba Device" })
})

routerd.post('/dispositivo', (req, res) => {
    const us = esquema(req.body);
    us.save()
        .then(data => res.json(data))
        .catch(error => res.json({ message: error }))
})

//leer dispositivo
routerd.get('/dispositivo', (req, res) => {
    esquema.find()
        .then(data => res.json(data))
        .catch(error => res.json({ message: error }))
})

// Nuevo endpoint para enviar comandos a dispositivos específicos
routerd.post('/dispositivo/comando/:id', (req, res) => {
    const { id } = req.params; // ID del dispositivo
    const { comando } = req.body; // Comando enviado en el cuerpo de la solicitud

    const dispositivoIdValido = "65fd3f2f52b794079f541595";

    //LA LOGICA APLICADA AQUI PARA VERIFICAR EL ID, LO VAMOS A OCUPAR 
    //PARA VERIFICAR SI EL DISPOSITIVO COINCIDE CON ALGUNA QUE TENGA EL USUARIO


    // Verificar que el ID del dispositivo es el esperado
    if (id !== dispositivoIdValido) {
        // Si el ID no coincide, enviar una respuesta de error
        return res.status(400).json({ message: "ID de dispositivo inválido." });
    }

    // Si el ID es válido, proceder a publicar el comando al topic MQTT
    client.publish('dispensador/01', comando, (error) => {
        if (error) {
            console.error("Error al publicar mensaje MQTT", error);
            return res.status(500).json({ message: "Error al enviar comando MQTT." });
        }
        res.json({ message: "Comando enviado con éxito." });
    });
});


//buscar dispositivo
routerd.get('/dispositivo/:id', (req, res) => {
    const { id } = req.params
    esquema.findById(id)
        .then(data => res.json(data))
        .catch(error => res.json({ message: error }))
})

//actualizar dispositivo
routerd.put('/dispositivo/:id', (req, res) => {
    const { id } = req.params;
    const { led, pesoAlimento, pesoAgua, nivelAlimento, nivelAgua, botonAlimento, botonAgua } = req.body
    esquema
        .updateOne({ _id: id }, { $set: { led, pesoAlimento, pesoAgua, nivelAlimento, nivelAgua, botonAlimento, botonAgua } })
        .then((data) => res.json(data))
        .catch((error) => res.json({ message: error }))
})

//eliminar dispositivo
routerd.delete('/dispositivo/:id', (req, res) => {
    const { id } = req.params;
    esquema.deleteOne({ _id: id })
        .then(data => res.json(data))
        .catch(error => res.json({ message: error }))
})

module.exports = routerd