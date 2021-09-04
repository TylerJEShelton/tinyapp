const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const app = express();
const PORT = 8080; // default port 8080
const saltRounds = 12;

// URL Database that stores the shortURLS as the key with each one containing an object w/ longURL and the userID of who created the shortURL
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "HxTaMS" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "HxTaMS" },
  "Sa4H9a": { longURL: "http://www.espn.com", userID: "e8LUlT" },
  "1aLX7o": { longURL: "http://www.tsn.ca", userID: "e8LUlT" },
};

// Temporarily show the plain text passwords of the 3 sample users
const users = {
  "SgFq8X": {
    id: "SgFq8X",
    email: "user@example.com",
    password: "$2b$12$UPN2lUaoX5NUXW/QVWa3iuakUIF08jXUYiGssIsx3I9e8NreJjcYa" // purple-monkey-dinosaur
  },
  "HxTaMS": {
    id: "HxTaMS",
    email: "user2@example.com",
    password: "$2b$12$ous9UjTKm9y0Rmi5WxXQZO8yg16ZgIJgaoc6kuWDZMcCCYWk/P3F6" // dishwasher-funk
  },
  "e8LUlT": {
    id: "e8LUlT",
    email: "tylertheman@gmail.com",
    password: "$2b$12$6yDJfQkLIhJKodyLeamvMumb4BVDAtptg3kbdWMra6mLYkUNRy7ai" // 123GarbageCan%
  }
};

// function will generate random strings that will be used to create the shortURL's created, the new user ID's and the cookie
const generateRandomString = () => {
  let randomString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const stringLength = 6;
  for (let i = 0; i < stringLength; i++) {
    randomString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randomString;
};

// function takes in an email and returns the user id that's associated with that email or false if the user doesn't exist
const lookupUserByEmail = (email, database) => {
  for (const id in users) {
    if (users[id].email === email) return id;
  }
  return false;
};

// function will loop through the URL database and returns an object of urls that the passed in id is associated with
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

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  keys: ['key1', 'key2']
}));

app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  const userID = req.session.user_id;
  urlDatabase[newShortURL] = { "longURL": req.body.longURL };
  urlDatabase[newShortURL]["userID"] = userID;
  //urlDatabase[newShortURL]["userID"] = req.cookies["user_id"];
  const templateVars = {
    user: users[userID],
    //user: users[req.cookies["user_id"]],
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

  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  users[newUserID] = {
    id: newUserID,
    email: email,
    password: hashedPassword
  };
  req.session.user_id = newUserID;
  //res.cookie("user_id", newUserID);
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  //if (urlDatabase[req.params.shortURL].userID !== req.cookies["user_id"]) {
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.status(403).send("This is not your link!  Please sign in to the proper account to access this link!");
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
  if (!bcrypt.compareSync(password, users[userID].password)) {
    return res.status(403).send("You have entered the incorrect password.  Please try again.");
  }

  req.session.user_id = userID;
  // res.cookie("user_id", userID);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  //res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  urlDatabase[req.params.shortURL] = { "longURL": req.body.longURL };
  urlDatabase[req.params.shortURL]["userID"] = userID;
  //urlDatabase[req.params.shortURL]["userID"] = req.cookies["user_id"];
  const templateVars = {
    user: users[userID],
    //user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: req.body.longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  //res.send("Hello!");
  res.redirect("/urls");
});

// temporary endpoint to visually view the current urlDatabase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// temporary endpoint to visually view the current users
app.get("/users.json", (req, res) => {
  res.json(users);
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const currentUserURLS = urlsForUser(userID);
  const templateVars = {
    user: users[userID],
    urls: currentUserURLS
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID],
    urls: urlDatabase
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID],
    urls: urlDatabase
  };
  res.render("login", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!users[userID]) {
    res.redirect("/login");
    return;
  }
  const templateVars = {
    user: users[userID],
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (urlDatabase[req.params.shortURL].userID !== userID) {
    return res.status(400).send("This is not your link!  Please sign in to the proper account to access this link!");
  }
  const templateVars = {
    user: users[userID],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});