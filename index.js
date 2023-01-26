require('dotenv').config('.env');
const cors = require('cors');
const express = require('express');
const app = express();
const morgan = require('morgan');
const { PORT = 3000 } = process.env;
// TODO - require express-openid-connect and destructure auth from it
const { auth } = require('express-openid-connect');
const { User, Cupcake } = require('./db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env; 

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

  app.use(async (req, res, next) => {
    try{
      const [user] = await User.findOrCreate({
        where: {
          username : `${req.oidc.user.nickname}`,
          name : `${req.oidc.user.name}`,
          email : `${req.oidc.user.email}`
        }
      });
      console.log('user: ', req.oidc.user)
      console.log('username: ', req.oidc.user.username)
      console.log(user)
      next();
    }
    catch(error){
      next(error);
    }
  });
  // req.isAuthenticated is provided from the auth router
  app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? `
    <h2 style="text-align: center;">My Crypto Cupcakes, Inc.</h2>
    <h2>Welcome, ${req.oidc.user.name}</h2>
    <p><b>Username: ${req.oidc.user.email}</b></p>
    <p><b>Email: ${req.oidc.user.email}</p>
    <img src="${req.oidc.user.picture}" alt="${req.oidc.user.name}">
    ` : 'Logged out');
  });

  app.get("/me", async(req,res,next)=> {
    try{
      // Find user with User.findOne
      const user = await User.findOne({
        where: {
          username: req.oidc.user.nickname
        },
        raw: true,
      });
  
      // If/else statement - Assign token with user. No user, no token
      if(user){
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1w' });
  
        // Send back the object {user, token}
        res.send({user, token})
  
      }else{
        res.status(401).send("No user");
      }
    }catch(error){
      console.error(error);
      next(error);
    }
  })
  
  
app.get('/cupcakes', async (req, res, next) => {
  try {
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

