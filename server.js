const express = require("express");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using HTTPS
}));

// Static files
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// In-memory user storage (replace with database in production)
const users = [
  { 
    email: "user@example.com", 
    password: bcrypt.hashSync("password", 8) 
  }
];

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Authentication middleware
function isAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login.html");
}

// Routes
app.get("/", isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "upload.html"));
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = email;
    return res.redirect("/upload.html");
  }
  res.status(401).send("Invalid credentials");
});

app.post("/upload", isAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  res.send(`
    <h1>File uploaded successfully!</h1>
    <p>Filename: ${req.file.filename}</p>
    <p>Original name: ${req.file.originalname}</p>
    <p>Size: ${req.file.size} bytes</p>
    <a href="/upload.html">Upload another file</a>
  `);
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("Test user: user@example.com / password");
});