require("dotenv").config();

const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const helmet = require("helmet");
const cors = require("cors");
const volleyball = require("volleyball");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const port = process.env.PORT;
const client = process.env.CLIENT;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(helmet());
app.use(cors());
app.use(volleyball);
app.use(bodyParser.json());
app.use(cookieParser());

require("./socket.js")(io);

app.use("/api/v1/users", cors({origin: client}), require("./users/router"));

/**
 * Error handler
 */
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({ message: err.message });
});

server.listen(port, () => {
  console.log(`Server starting at ${port}`);
});
