const express = require("express");
const app = express();
const bodyParser =require( 'body-parser');
const crypto = require("crypto");


app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())


app.post("/genCheckSum", (req, res) => {
    const data = req.body;
  //  console.log('param',data);
    const mySum = checkSum(data.msisdn,data.amount,data.description,"","","","");
    console.log('gen',mySum);
    res.send({'checkSum' :mySum });
  });

function checkSum(toMsisdn, amount, description,remark1,remark2,remark3,remark4) {
    //const hash = crypto.createHash('sha256').update(pwd).digest('base64');
    //const input_str = `REF,2055220199,150000,LAK,ໝາເຫດ,ເລກອ້າງອິງ01,ເລກອ້າງອິງ02,ເລກອ້າງອິງ03,ເລກອ້າງອິງ04,ltc`;
  

    const input_str = `REF,${toMsisdn},${amount},LAK,${description},${remark1},${remark2},${remark3},${remark4},ltc`;
  
    //const input_str = "REF,2055220199,1000,LAK,,,,,,ltc";
    const hash = crypto.createHash("sha256").update(input_str).digest("base64");
  
    return hash;
  }

 
  //module.exports.checkSum = checkSum;

app.listen(9000, () => {
  console.log("server listening on port 9000!");
});