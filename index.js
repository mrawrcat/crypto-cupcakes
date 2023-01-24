require('dotenv').config('.env');
const cors = require('cors');
const express = require('express');
const app = express();
const morgan = require('morgan');
const { PORT = 3000 } = process.env;
// TODO - require express-openid-connect and destructure auth from it
const { auth } = require('express-openid-connect');
const { User, Cupcake } = require('./db');

// middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

/* *********** YOUR CODE HERE *********** */
// follow the module instructions: destructure config environment variables from process.env
// follow the docs:
  // define the config object
  // attach Auth0 OIDC auth router
  // create a GET / route handler that sends back Logged in or Logged out
  const {
    AUTH0_SECRET, //= 'a long, randomly-generated string stored in env', // generate one by using: `openssl rand -base64 32`
    AUTH0_AUDIENCE = 'http://localhost:3000',
    AUTH0_CLIENT_ID,
    AUTH0_BASE_URL,
  } = process.env;
  
  const config = {
    authRequired: true,
    auth0Logout: true,
    secret: AUTH0_SECRET,
    baseURL: AUTH0_AUDIENCE,
    clientID:  AUTH0_CLIENT_ID,
    issuerBaseURL: AUTH0_BASE_URL
  };

  // auth router attaches /login, /logout, and /callback routes to the baseURL
  app.use(auth(config));
  // req.isAuthenticated is provided from the auth router
  app.get('/', (req, res) => {
    console.log(req.oidc.user);
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  });
  
app.get('/cupcakes', async (req, res, next) => {
  try {
    //console.log(req.oidc.user);
    const cupcakes = await Cupcake.findAll();
    res.send(cupcakes);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// error handling middleware
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

app.listen(PORT, () => {
  console.log(`Cupcakes are ready at http://localhost:${PORT}`);
});

