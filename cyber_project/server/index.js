const express = require("express");
const app = express();
const cors = require("cors");

//middlewarre

app.use(express.json());
app.use(cors());


//routes



//register and login 

app.use("/auth", require("./routes/jwtAuth"));


// dashboard route

app.use("/dashboard", require("./routes/dashboard"));

app.listen(5001, () => {
    console.log("server is running on port 5001");
});