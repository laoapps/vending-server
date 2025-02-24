
var express = require('express');
var app = express();
var p ='/app/www/';
app.use(express.static(p));
app.use('*',(req,res)=>{
res.sendFile(p+'/index.html');
});
var host = '0.0.0.0';
var port = process.env.PORT;
app.listen(port,host,()=>{
    console.log('Server start',host,port);
});