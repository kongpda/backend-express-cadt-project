const express = require("express");
const app = express();

app.get("/", function(req, res) {
    return res.send("Hello World from Express");
});
// Health check endpoint (good practice for Docker)
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});
app.listen(3000, function(){
    console.log('Listening on port 3000');
});
