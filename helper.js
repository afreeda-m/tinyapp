// loop through users database and check if user email already exists
// to be used when registering or when user tries to login
const getUserByEmail = function(email, userDatabase) {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user];
    }
  }
};

module.exports = { getUserByEmail };