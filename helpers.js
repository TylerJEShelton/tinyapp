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

// function takes in an email and returns the user id that's associated with that email or undefined if the user doesn't exist
const lookupUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) return user;
  }
  return;
};

// function takes in a user ID and returns true if the user exists or false if the user doesn't exist
const checkUserExists = (id, database) => {
  for (const user in database) {
    if (user === id) return true;
  }
  return false;
};

// function will loop through the URL database and returns an object of urls that the passed in id is associated with
const urlsForUser = (id, database) => {
  const usersURLS = {};
  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      usersURLS[shortURL] = { longURL: database[shortURL].longURL };
      usersURLS[shortURL].userID = database[shortURL].userID;
    }
  }
  return usersURLS;
};

module.exports = {
  generateRandomString,
  lookupUserByEmail,
  checkUserExists,
  urlsForUser
};