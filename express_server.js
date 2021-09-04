const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "user1RandomID": {
    id: "user1RandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const generateRandomString = () => {
  let randomString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const stringLength = 6;
  for (let i = 0; i < stringLength; i++) {
    randomString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randomString;
};

const lookupUserByEmail = email => {
  for (const id in users) {
    if (users[id].email === email) return id;
  }
  return false;
}

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");


app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: newShortURL,
    longURL: req.body.longURL
  };
  res.render("urls_show", templateVars);
});

app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("The email and/or password entered are blank.  These fields must contain values and can't be left blank.");
  }
  if (lookupUserByEmail(email)) {
    return res.status(400).send("This email is already associated with a user.  Please register with a new email address or login with the email you provided.");
  }

  users[newUserID] = {
    id: newUserID,
    email: email,
    password: password
  };

  res.cookie("user_id", newUserID);
  console.log(req.body);
  console.log(users);
  console.log(req.cookies);
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userID = lookupUserByEmail(email);

  if (!email || !password) {
    return res.status(400).send("The email and/or password entered are blank.  These fields must contain values and can't be left blank.");
  }
  if (!userID) {
    return res.status(400).send("This email does not have an account registered.  Please register with this email address or login with a different email address that is already associated with an account.");
  }

  if (users[userID].password !== password) {
    return res.status(400).send("You have entered the incorrect password.  Please try again.");
  }

  res.cookie("user_id", userID);
  console.log(res.cookies);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: req.body.longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("login", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});