const express = require('express'); // Import the express library
const app = express(); // Make app as an instance of express
const cookieParser = require('cookie-parser');
const PORT = 8080; //default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());

const generateRandomString = function (stringLength) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';

  let result = '';
  const charsLength = chars.length;
  for (let i = 0; i < stringLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  return String(result);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.use(express.urlencoded({ extended: true }));

app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies.username,
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

app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVar = {
    username: ""
  }
  res.render("urls_register", templateVar);
});

app.post('/urls/:id/update', (req, res) => {
  const templateVar = {
    username: req.cookies.username,
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  }

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
    username: req.cookies.username
  }
  res.render("urls_new", templateVar);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    username: req.cookies.username,
    id: req.params.id, 
    longURL: urlDatabase[req.params.id]};
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