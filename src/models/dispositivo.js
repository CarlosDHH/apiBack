const mongoose=require('mongoose')
const dispositivoSchema=mongoose.Schema(
    {
        led:{type:String,require:false},
        pesoAlimento:{type:String,require:false},
        pesoAgua:{type:String,require:false},
        nivelAlimento:{type:String,require:false},
        nivelAgua:{type:String,require:false},
        botonAlimento:{type:String,require:false},
    }
);

const Dispositivo=mongoose.model('Dispositivo',dispositivoSchema)    
module.exports=Dispositivo;