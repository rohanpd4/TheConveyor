const express = require("express");
const router = express.Router();
const bodyparser = require("body-parser");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const passportjwt = require("passport-jwt");
const jwt = require("jsonwebtoken");
const key = require("../../setup/DBSetup").secret;

router.use(bodyparser.urlencoded({ extended: false }));
router.use(bodyparser.json());

const Person = require("./../../models/Person");

router.get("/", (req, res) => {
  res.json({ sucess: true });
});

//REGISTER ROUTE

router.post("/register", (req, res) => {
  Person.findOne({ email: req.body.email })
    .then(person => {
      if (person) {
        res.status(400).json({ message: "User already registered" });
      } else {
        const newPerson = new Person({
          name: req.body.name,
          password: req.body.password,
          email: req.body.email
        });

        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(newPerson.password, salt, function(err, hash) {
            // Store hash in your password DB.
            newPerson.password = hash;

            newPerson
              .save()
              .then(person => {
                res.json(person);
              })
              .catch(err => {
                console.log(err);
              });
          });
        });
      }
    })
    .catch(err => {
      console.log(err);
    });
});

//LOGIN ROUTE

router.post("/login", (req, res, next) => {
  Person.findOne({ email: req.body.email })

    .then(person => {
      if (person) {
        if (person.email == req.body.email) {
          bcrypt
            .compare(req.body.password, person.password)

            .then(res1 => {
              // res === true

              if (res1) {
                //Create Payload
                //  res.json({ sucess: true, message: "Login Sucessfully" });

                const payload = {
                  name: person.name,
                  id: person.id,
                  email: person.email,
                  password: person.password,
                  profilepic: person.profilepic
                };

                jwt.sign(payload, key, { expiresIn: 60 * 60 }, (err, token) => {
                  if (err) throw err;
                  res.json({ sucess: true, token: "Bearer " + token });
                  next();
                });
              } else {
                res.json({ message: "Password wrong" });
              }
            })
            .catch(err => {
              console.log(err);
            });
        }
      } else {
        res.json({ message: "Usernot found" });
      }
    })
    .catch(err => console.log(err));
});

//PROFILE ROUTE

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.send({
      name: req.user.name,
      email: req.user.email,
      profilepic: req.user.profilepic
    });
  }
);

module.exports = router;
