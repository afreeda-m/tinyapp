const express = require('express'); // Import the express library
const app = express(); // Make app as an instance of express
const cookieParser = require('cookie-parser'); // middleware to read client request cookies
const PORT = 8080; //default port 8080

app.set("view engine", "ejs"); // set all .ejs as the templates
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

// use this function to make random string for shortURL and userID
const generateRandomString = function(stringLength) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';

  let result = '';
  const charsLength = chars.length;
  for (let i = 0; i < stringLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  return String(result);
};

// read request cookie to get userID and find the correct user object
// to be used every time to remember user as they move to another page of the website
const getUserFromCookie = function(req) {
  const userID = req.cookies.userID;
  const currentUser = users[userID];
  return currentUser;
};

// loop through users database and check if user email already exists
// to be used when registering or when user tries to login
const getUserByEmail = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
};

// an object to store user data for making cookies
const users = {};

// database for all URLs shortened and long
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (req, res) => {
  const templateVars = {
    user: getUserFromCookie(req),
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString(6);
  const longURL = req.body;

  urlDatabase[id] = longURL['longURL'];

  res.redirect(`/urls/${id}`);
});

app.get("/login", (req, res) => {
  const templateVar = {
    user: null
  };
  res.render("urls_login", templateVar);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const currentUser = getUserByEmail(email);

  if (!currentUser) {
    res.status(403).send("E-mail not found");
    return;
  }

  if (currentUser.password !== password) {
    res.status(403).send("Invalid password");
    return;
  }

  res.cookie("userID", currentUser.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {

  res.clearCookie("userID");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const templateVar = {
    user: null
  };
  res.render("urls_register", templateVar);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // validate credentials
  if (!email || !password) {
    res.status(400).send("Invalid credentials");
    return;
  }

  const foundUser = getUserByEmail(email);

  if (foundUser) {
    res.status(400).send("Email already exists");
    return;
  }

  // if all of the above checks are ok, continue with registration
  // generate random ID for new user
  const userID = generateRandomString(5);

  // create an object for new user
  const newUser = {
    id: userID,
    email: email,
    password: password
  };

  // Add new user to users database
  users[userID] = newUser;

  // set the userID cookie
  res.cookie('userID', userID);

  res.redirect("/urls");
});

app.post('/urls/:id/update', (req, res) => {
  const templateVar = {
    user: getUserFromCookie(req),
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };

  if (req.body.new_url) {
    templateVar["longURL"] = req.body.new_url;
    urlDatabase[templateVar.id] = req.body.new_url;
  }

  res.render("urls_show", templateVar);
});

app.post('/urls/:id/delete', (req, res) => {
  const urlID = req.params.id;
  for (const id in urlDatabase) {
    if (urlID === id) {
      delete urlDatabase[id];
    }
  }
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  const templateVar = {
    user: getUserFromCookie(req)
  };
  res.render("urls_new", templateVar);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: getUserFromCookie(req),
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});