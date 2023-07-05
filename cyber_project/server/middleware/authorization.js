const jwt = require("jsonwebtoken");
// require("dotenv").config()

module.exports = async (req, res, next) => {
    try {
        
        // console.log(req.header("token"));
        const jwtToken = req.header("token");

        if (!jwtToken){
            return res.status(403).json("Not Authorize");
        }

        const payload = jwt.verify(jwtToken, "cat123")
        // const userId = payload.sub
        // req.user = userId
        req.user = payload.user;
        next();

    } catch (err) {
        console.error(err.message);
        return res.status(403).json("Not Authorize");
    }
}