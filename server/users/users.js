require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10;
const url = process.env.DB_URI;

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.once("open", () => {
  console.log("mongoose connected");
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    name_lower: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

/**
 * Adding a user to database
 * @param {username, password, email} user (adding name_lower here)
 */
function addToDB(user) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(user.password, saltRounds, (hashErr, hash) => {
      if (hashErr) reject(hashErr);
      else {
        //name_lower is for querying ease.
        const toAdd = new User({
          username: user.username,
          password: hash,
          email: user.email.toLowerCase(),
          name_lower: user.username.toLowerCase(),
        });

        toAdd.save((err, userAdded) => {
          if (err) reject(err);
          resolve(userAdded);
        });
      }
    });
  });
}

/**
 * Check if a user is already in the database.
 * Query is by name OR email.
 * @param {username, password, email} user
 * @param {*} callback returns a promise
 */
function checkExistence(user) {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        $or: [
          // $or = exists with a name, or email, not both.
          { name_lower: user.username.toLowerCase() },
          { email: user.email.toLowerCase() },
        ],
      },
      (err, userInDB) => {
        if (!userInDB) resolve(user);
        else if (userInDB)
          reject("A user with that email/username already exists");
        else reject(err);
      }
    );
  });
}

/**
 * Exported function for insertion to database.
 * @param {username, password, email} user
 */
function Insert(user) {
  return new Promise((resolve, reject) => {
    checkExistence(user)
      .then(addToDB)
      .then((response) => resolve(response))
      .catch((error) => {
        return reject(error);
      });
  });
}

/**
 * Get jwt token, payload username.
 * @param {username, password} data
 * @return {token} jwt token. 
 */
function getJwtToken(data) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { username: data.username },
      process.env.SECRET,
      (error, token) => {
        if (error) reject(error);
        if (!token) reject("Couldn't get token, contact site admin");
        resolve(token);
      }
    );
  });
}

/**
 * Validate username against database.
 * @param {username, password} data 
 * @return {user} object of the user from db.
 */
function ValidateFromDB(data) {
  return new Promise((resolve, reject) => {
    User.findOne({ name_lower: data.username.toLowerCase() }, (error, user) => {
      if (error) reject(error);
      if (!user) reject("User not found");
      resolve(user);
    });
  });
}

/**
 * Validate login information.
 * @param {username, password} req
 * @return {token} jwt token. 
 */
function Validate(req) {
  return new Promise((resolve, reject) => {
    ValidateFromDB(req)
    //Notice that bcrypt also returns a promise.
      .then((user) => bcrypt.compare(req.password, user.password))
      //bcrypt returns boolean for password compatibility.
      .then((result) => result ? getJwtToken(req) : reject("Incorrect login information"))
      .then((token) => resolve(token))
      .catch((error) => reject(error));
  });
}

function Verify(data) {
  const token = data.authorization.split(' ')[1]; //get read of 'bearer'
  return new Promise((resolve, reject) => {
    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      resolve(decoded)
    } catch(error) {
      reject(error);
    }
  })
}


module.exports = {
  Insert,
  Validate,
  Verify,
};
