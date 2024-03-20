const express=require('express')
const esquema=require('../models/empresa')

const routerem=express.Router()

routerem.post('/empresa',(req,res)=>{
    const us= esquema(req.body);
    us.save()
    .then(data=>res.json(data))
    .catch(error=>res.json({message:error}))
})

//leer empresa
routerem.get('/empresa',(req,res)=>{
    esquema.find()
    .then(data=>res.json(data))
    .catch(error=>res.json({message:error}))
})

//actualizar empresa
routerem.put('/empresa/:id',(req,res)=>{
    const{id}=req.params;
    const{descripcion,mision,vision,valores,politicas,terminos,privacidad,contacto}=req.body
    esquema
    .updateOne({_id:id},{$set:{descripcion,mision,vision,valores,politicas,terminos,privacidad,contacto}})
    .then((data)=>res.json(data))
    .catch((error)=>res.json({message:error}))
})

//eliminar empresa
routerem.delete('/empresa/:id',(req,res)=>{
    const{id}=req.params;
    esquema.deleteOne({_id:id})
    .then(data=>res.json(data))
    .catch(error=>res.json({message:error}))
})

module.exports=routerem