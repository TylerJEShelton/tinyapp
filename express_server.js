// Program Name: TinyApp
// Written By: Tyler Shelton
// Started On: August 28, 2021
// Description: This program allows a user to login/register as a user and create, store and share short URLs for longer URLs 
// ---------------------------------------------------------------------------------------------------------------------------------

// Requires and constants
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const { generateRandomString, lookupUserByEmail, urlsForUser } = require("./helpers");
const PORT = 8080; // default port 8080
const saltRounds = 12;  // default saltRounds for bcrypt

const app = express();

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

// Middleware

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  keys: ['key1', 'key2']
}));

// POST Endpoints

// creates a new short url for logged in users and send them to the show URL page
app.post("/urls", (req, res) => {
  // generates a random 6 letter string to be the shortURL
  const newShortURL = generateRandomString();
  const userID = req.session.user_id;
  const longURL = req.body.longURL;
  urlDatabase[newShortURL] = { "longURL": longURL };
  urlDatabase[newShortURL]["userID"] = userID;
  const templateVars = {
    user: users[userID],
    shortURL: newShortURL,
    longURL: longURL
  };
  res.render("urls_show", templateVars);
});

// registers a new user
app.post("/register", (req, res) => {
  // generates a random 6 letter string to be the shortURL
  const newUserID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  // if the email or password fields are left blank, send the user to the error page
  if (!email || !password) {
    const templateVars = {
      user: users[null],
      error: "400 - The email and/or password entered are blank.  These fields must contain values and cannot be left blank."
    };
    return res.status(400).render("error", templateVars);
  }
  // if the email address entered is associated with a user that is already registered, send them to the error page
  if (lookupUserByEmail(email, users)) {
    const templateVars = {
      user: users[null],
      error: "400 - This email is already associated with a user.  Please register with a new email address or login with the email you provided."
    };
    return res.status(400).render("error", templateVars);
  }
  // if the email and password entered are valid, hash the password and create the new user
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  users[newUserID] = {
    id: newUserID,
    email: email,
    password: hashedPassword
  };
  // set the newUserID to the cookie and redirect to the index page
  req.session.user_id = newUserID;
  res.redirect("/urls");
});

// deletes the selected short URL from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  // if a shortURL delete request is submitted by an unauthorized user, send them to the error page 
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      error: "403 - Unauthorized access to this link!  You cannot delete this link! Please sign in to the proper account to access this link!"
    };
    return res.status(403).render("error", templateVars);
  }
  // if the owner of the shortURL requests to delete the url, allow it and redirect to the index page
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// logs the user into the account information they provide
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // if either the email or password fields are left blank, send the user to the error page
  if (!email || !password) {
    const templateVars = {
      user: users[userID],
      error: "400 - The email and/or password entered are blank.  These fields must contain values and can't be left blank."
    };
    return res.status(400).render("error", templateVars);
  }
  // check to see if the email address is connected to a current user in the database and return the userID
  const userID = lookupUserByEmail(email, users);
  // if the user does not currently exist in the database, send them to the error page
  if (!userID) {
    const templateVars = {
      user: users[userID],
      error: "400 - This email does not have an account registered.  Please register with this email address or login with a different email address that is already associated with an account."
    };
    return res.status(400).render("error", templateVars);
  }
  // if the password the user tried does not match the stored password for the email provided, send the user to the error page
  if (!bcrypt.compareSync(password, users[userID].password)) {
    const templateVars = {
      user: users[null],
      error: "403 - You have entered the incorrect password.  Please try again."
    };
    return res.status(403).render("error", templateVars);
  }
  // if the user exists, and logs in successfully with the proper credentials, set the cookie and send them to the index page
  req.session.user_id = userID;
  res.redirect("/urls");
});

// Logs the user out when the logout button is pressed and destroys the cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// edits the current long URL for the associated short URL 
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  // if the short URL does not exist, send the user to the error page
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: users[userID],
      error: "400 - This is not a valid link!"
    };
    return res.status(400).render("error", templateVars);
  }
  urlDatabase[shortURL].longURL = longURL;
  const templateVars = {
    user: users[userID],
    shortURL: shortURL,
    longURL: longURL
  };
  res.render("urls_show", templateVars);
});

// GET Endpoints

//temporary endpoint to visually view the current urlDatabase for debugging purposes
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// temporary endpoint to visually view the current users for debugging purposes
// app.get("/users.json", (req, res) => {
//   res.json(users);
// });

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// main page which displays urls if logged into a user with urls and a message stating that the viewer needs to registe/login or create new urls
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const currentUserURLS = urlsForUser(userID, urlDatabase);
  const templateVars = {
    user: users[userID],
    urls: currentUserURLS
  };
  res.render("urls_index", templateVars);
});

// registration page for users to create a new account
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID],
    urls: urlDatabase
  };
  res.render("register", templateVars);
});

// login page for users to sign into an existing account
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID],
    urls: urlDatabase
  };
  res.render("login", templateVars);
});

// page that will allow signed in users to create new urls
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  // if not signed in, send to the login page
  if (!users[userID]) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[userID],
  };
  res.render("urls_new", templateVars);
});

// this endpoint will redirect users to the long URLs that they have associated with the specific short URL
app.get("/u/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  // if the shortURL does not exist, send to the error page
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: users[userID],
      error: "400 - This is not a valid link!"
    };
    return res.status(400).render("error", templateVars);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// this page will send users to the short URL detail page where they can edit the long URL
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  // if the shortURL does not exist, send to the error page
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: users[userID],
      error: "400 - This is not a valid link!"
    };
    return res.status(400).render("error", templateVars);
  }
  const shortURL = req.params.shortURL;
  // if the shortURL does not belong to the current logged in user, send to error page with Unauthorized message
  if (urlDatabase[shortURL].userID !== userID) {
    const templateVars = {
      user: users[userID],
      error: "403 - Unauthorized access to this link!  Please sign into the proper account to access this link!"
    };
    return res.status(403).render("error", templateVars);
  }
  const templateVars = {
    user: users[userID],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

// handles pages that are requested but do not exist
app.get('*', function(req, res) {
  const templateVars = {
    user: users[req.session.user_id],
    error: "404 - This page does not exist!  Please click one of the links above!"
  };
  return res.status(404).render("error", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});