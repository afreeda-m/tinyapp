const express = require('express'); // Import the express library
const app = express(); // Make app as an instance of express object
const cookieSession = require('cookie-session'); // middleware to read client request cookies
const { getUserByEmail } = require('./helper');
const bcrypt = require('bcryptjs'); // import hash and encryption package
const PORT = 8080; //default port 8080

app.set("view engine", "ejs"); // set all .ejs as the templates

app.use(cookieSession({
  name: "session",
  keys: ['lighthouselabsPasswordKey'],
  maxAge: 24 * 60 * 60 * 1000
}));

// middleware
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
  const userID = req.session.user_id;
  const currentUser = userDatabase[userID];
  return currentUser;
};

const urlsForUser = function(id) {
  const userURLs = {};

  for (const item in urlDatabase) {
    if (urlDatabase[item].userID === id) {
      userURLs[item] = urlDatabase[item];
    }
  }
  return userURLs;
};

// an object to store user data for making cookies
const userDatabase = {};

// database for all URLs shortened and long
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "default"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "default"
  }
};

// set index page for urls
app.get("/urls", (req, res) => {
  if (!getUserFromCookie(req)) {
    res.status(402).send("Please log in.");
    return;
  }

  const currentUser = getUserFromCookie(req);

  const templateVars = {
    user: currentUser,
    urls: urlsForUser(currentUser.id)
  };
  
  res.render("urls_index", templateVars);
});

// POST new urls into user URL database
app.post("/urls", (req, res) => {
  if (!getUserFromCookie(req)) {
    res.status(403).send("Please log in to shorten URLs");
    return;
  }

  const id = generateRandomString(6);

  const longURL = req.body;
 
  const currentUserID = getUserFromCookie(req).id;

  urlDatabase[id] = {
    longURL: longURL['longURL'],
    userID: currentUserID
  };

  res.redirect(`/urls/${id}`);
});

// login page
app.get("/login", (req, res) => {
  if (getUserFromCookie(req)) {
    res.redirect("/urls");
    return;
  }

  const templateVar = {
    user: null
  };
  res.render("urls_login", templateVar);
});

// POST login information to sign in user
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const currentUser = getUserByEmail(email, userDatabase);

  if (!currentUser) {
    res.status(403).send("E-mail not found");
    return;
  }

  if (!bcrypt.compareSync(password, currentUser.password)) {
    res.status(403).send("Invalid password.");
    return;
  }

  req.session.user_id = currentUser.id;

  res.redirect("/urls");
});

// clear cookies and logout user
app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/login");
});

// show registration page
app.get("/register", (req, res) => {
  if (getUserFromCookie(req)) {
    res.redirect("urls");
  }

  const templateVar = {
    user: null
  };

  res.render("urls_register", templateVar);
});

// POST registration information in user database object
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // validate credentials
  if (!email || !password) {
    res.status(400).send("Invalid credentials");
    return;
  }

  const foundUser = getUserByEmail(email, userDatabase);

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
    password: bcrypt.hashSync(password, 10)
  };

  // Add new user to users database
  userDatabase[userID] = newUser;

  // set the userID cookie
  req.session.user_id = userID;

  res.redirect("/urls");
});

app.post('/urls/:id/update', (req, res) => {
  if (!getUserFromCookie(req)) {
    res.status(403).send("Please log in to view URLs!");
    return;
  }

  const currentUserID = getUserFromCookie(req).id;

  const id = req.params.id;

  // check if current user has the url in their database
  if (urlDatabase[id].userID !== currentUserID) {
    res.status(404).send("Cannot find URL for this user.");
    return;
  }

  if (!urlDatabase[id]) {
    res.status(404).send("URL does not exist!");
  }

  const templateVar = {
    user: getUserFromCookie(req),
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };

  if (req.body.new_url) {
    templateVar["longURL"] = req.body.new_url;
    urlDatabase[templateVar.id].longURL = req.body.new_url;
  }

  res.render("urls_show", templateVar);
});

// POST request to delete a url from database
app.post('/urls/:id/delete', (req, res) => {
  if (!getUserFromCookie(req)) {
    res.status(403).send("Please log in to view URLs!");
    return;
  }

  const currentUserID = getUserFromCookie(req).id;

  const id = req.params.id;

  if (urlDatabase[id].userID !== currentUserID) {
    res.status(404).send("Cannot find URL for this user.");
    return;
  }

  if (!urlDatabase[id]) {
    res.status(404).send("URL does not exist!");
  }

  const urlID = req.params.id;

  for (const id in urlDatabase) {
    if (urlID === id) {
      delete urlDatabase[id];
    }
  }
  
  res.redirect('/urls');
});


app.get("/urls/new", (req, res) => {
  if (!getUserFromCookie(req)) {
    res.redirect("/login");
    return;
  }

  const templateVar = {
    user: getUserFromCookie(req)
  };

  res.render("urls_new", templateVar);
});

app.get("/urls/:id", (req, res) => {
  if (!getUserFromCookie(req)) {
    res.status(403).send("Please log in to view URLs!");
    return;
  }

  const currentUserID = getUserFromCookie(req).id;

  const id = req.params.id;

  if (urlDatabase[id].userID !== currentUserID) {
    res.status(404).send("Cannot find URL!");
    return;
  }

  const templateVars = {
    user: getUserFromCookie(req),
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const url = urlDatabase[req.params.id];

  if (!url) {
    res.status(403).send("Shortened URL does not exist");
    return;
  }
  let longURL = url.longURL;

  // check that url starts with http
  if (!longURL.startsWith("http")) {
    longURL = "http://" + longURL;
  }

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