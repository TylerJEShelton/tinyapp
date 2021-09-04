const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "HxTaMS" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "HxTaMS" },
  "Sa4H9a": { longURL: "http://www.espn.com", userID: "e8LUlT" },
  "1aLX7o": { longURL: "http://www.tsn.ca", userID: "e8LUlT" },
};

const users = {
  "SgFq8X": {
    id: "SgFq8X",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "HxTaMS": {
    id: "HxTaMS",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "e8LUlT": {
    id: "e8LUlT",
    email: "tylertheman@gmail.com",
    password: "123GarbageCan%"
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
};

const urlsForUser = id => {
  const usersURLS = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      usersURLS[shortURL] = { longURL: urlDatabase[shortURL].longURL };
      usersURLS[shortURL].userID = urlDatabase[shortURL].userID;
    }
  }
  return usersURLS;
};

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");


app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  console.log(newShortURL);
  console.log(req.body.longURL);
  console.log(urlDatabase);
  console.log(urlDatabase[newShortURL]);
  urlDatabase[newShortURL] = { "longURL": req.body.longURL };
  urlDatabase[newShortURL]["userID"] = req.cookies["user_id"];
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: newShortURL,
    longURL: req.body.longURL
  };
  console.log(urlDatabase);
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
  if (urlDatabase[req.params.shortURL].userID !== req.cookies["user_id"]) {
    return res.status(400).send("This is not your link!  Please sign in to the proper account to access this link!");
  }
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
  urlDatabase[req.params.shortURL] = { "longURL": req.body.longURL };
  urlDatabase[req.params.shortURL]["userID"] = req.cookies["user_id"];
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: req.body.longURL
  };
  console.log(req.body);
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const currentUserURLS = urlsForUser(req.cookies["user_id"]);
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: currentUserURLS
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
  if (!users[req.cookies["user_id"]]) {
    res.redirect("/login");
    return;
  }
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.cookies["user_id"]) {
    return res.status(400).send("This is not your link!  Please sign in to the proper account to access this link!");
  }
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});