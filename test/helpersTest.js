const { assert } = require('chai');

const { lookupUserByEmail, urlsForUser, generateRandomString } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "newUser": {
    id: "newUser",
    email: "newuser@example.com",
    password: "tommy-fun-day"
  }
};

const testUrlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" },
  "Sa4H9a": { longURL: "http://www.espn.com", userID: "userRandomID" }
};

describe('lookupUserByEmail', () => {
  it('should return a user with valid email', function() {
    const user = lookupUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    // Write your assert statement here
    assert.strictEqual(user, expectedOutput);
  });
  it('should return undefined with an invalid email', function() {
    const user = lookupUserByEmail("use@example.com", testUsers);
    // Write your assert statement here
    assert.isUndefined(user);
  });

});

describe('urlsForUser', () => {
  it('should return an object containing the urls that are associated with the user ID', function() {
    const urls = urlsForUser("userRandomID", testUrlDatabase);
    const expectedOutput = {
      "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
      "Sa4H9a": { longURL: "http://www.espn.com", userID: "userRandomID" }
    };
    // Write your assert statement here
    assert.deepInclude(urls, expectedOutput);
  });
  it('should return an empty object with an id that has no urls attched to it', function() {
    const urls = urlsForUser("newUser", testUrlDatabase);
    const expectedOutput = {};
    // Write your assert statement here
    assert.deepInclude(urls, expectedOutput);
  });

});

describe('generateRandomString', () => {
  it('should return string length of 6', function() {
    const randomString = generateRandomString();
    const expectedOutput = 6;
    // Write your assert statement here
    assert.strictEqual(randomString.length, expectedOutput);
  });
});