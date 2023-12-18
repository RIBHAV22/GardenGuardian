const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const app = express();
const port = 5502;
const secretKey = crypto.randomBytes(32).toString("hex");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
app.use(cookieParser());
app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "plant_care",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }

  console.log("Connected to MySQL");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  connection.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Error checking user credentials:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
    } else {
      const hashedPassword = results[0].password;
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (passwordMatch) {
        req.session.user = {
          userId: results[0].id,
          email: results[0].email,
          username: results[0].username,
        };
        console.log("User details stored in session:", req.session.user);
        // localStorage.setItem('uemail',JSON.stringify(results[0].email));
        res.status(200).json({
          message: "Login successful",
          username: results[0].username,
          userId: results[0].id,
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    }
  });
});

app.get("/getUserData", (req, res) => {
  if (req.session.user && req.session.user.username) {
    res.json({ username: req.session.user.username });
  } else {
    res.status(401).json({ error: "User data not found" });
  }
});
app.get("/getUserDataFromOtherClient", (req, res) => {
  if (req.session.user && req.session.user.username) {
    res.json({ username: req.session.user.username });
  } else {
    res.status(401).json({ error: "User data not found" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
