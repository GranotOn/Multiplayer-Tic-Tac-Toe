var express = require('express');
var router = express.Router();

const users = require("./users.js");

/**
 * Create a new user 
 * @param {username, password, email} req.body
 */
//TODO schema validation
router.post("/", (req, res, next) => {
    users.Insert(req.body).then((user) => {
        res.send("Success");
    }).catch((error) => {
        next({status: 400, message: error});
    });
});

/**
 * Login route
 * @param {username, password} req.body
 * @return {token} jwt token.
 */
router.post("/login", (req, res, next) => {
    users.Validate(req.body).then((token) => {
        res.send(token);
    }).catch((error) => {
        next({status: 401, message: error});
    })
})

/**
 * Verify route.
 * @param {Authorization} req.headers
 * @return {result} is verified.
 */
router.get("/verify", (req, res, next) => {
    users.Verify(req.headers).then((response) => {
        res.send(response);
    }).catch((error) => {
        next({status: 400, message: error});
    })
})

module.exports = router;