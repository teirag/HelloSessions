// include modules
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var session = require('express-session');

// initialize express app
var app = express();

//initialize array for storing usernames
const users = {};

// tell passport to use a local strategy and tell it how to validate a username and password
passport.use(new LocalStrategy(function(username, password, done) {    
    //the done function is what we run when we have finished, it returns the error and an object
    if ((username && password) && !users[username])
    {
        users[username] = {username: username, password: password, data: {}};
        return done(null, { username: username, password: password, data: {} });
    }
    else if ((username && password) && users[username])
    {
         return done(null, users[username]);
    }
    return done(null, false);
}));

// tell passport how to turn a user into serialized data that will be stored with the session
passport.serializeUser(function(user, done) {
    //turn this user object intoa string we can use
    done(null, user.username);
});

// tell passport how to go from the serialized data back to the user
passport.deserializeUser(function(id, done) {
    //turn the object-turned-string abck into an object
    done(null, users[id]);
});

// tell the express app what middleware to use
//turns bytes into data we can use
app.use(bodyParser.urlencoded({ extended: true }));
// turns cookie info in objects we can use
app.use(cookieParser());
// manages sessions for express
app.use(session({ secret: 'secret key', resave: false, saveUninitialized: true }));
// helps keep track of who logs ins in cahoots with session
//runs through the passport middleware
app.use(passport.initialize());
//works with initialize
app.use(passport.session());

//
app.get('/health', function (req, res) {
	res.sendStatus(200);
})

app.post('/login', passport.authenticate('local'), function(req, res) {
    res.status(200);
    res.send(req.user.data);
})

app.get('/logout', function(req, res) {
    req.logout();
    res.sendStatus(200);
})

app.put('/', function(req, res){
    if (req.user)
    {
        users[req.user.username].data[req.query.key] = req.query.value;
        //req.user.data[req.query.value];
        //res.send(req.user);
        return res.send(req.user.data);
    }
    res.sendStatus(401);
})

app.delete('/', function(req, res) {
    if (req.user)
    {
        delete users[req.user.username].data[req.query.key];
        return res.send(req.user.data);
    }
    res.sendStatus(401);
})

// home page
app.get('/', function (req, res) {
    if (req.user) return res.send(req.user.data);
    res.sendStatus(401);
});

// specify a URL that only authenticated users can hit
app.get('/protected',
    function(req, res) {
        if (!req.user) return res.sendStatus(401);
        res.send('You have access.');
    }
);

// specify the login url
app.put('/auth',
    passport.authenticate('local'),
    function(req, res) {
        res.send('You are authenticated, ' + req.user.username);
    });

// log the user out
app.delete('/auth', function(req, res) {
    req.logout(); //this kills our cookie we have saved
    res.send('You have logged out.');
});

// start the server listening
app.listen(3000, function () {
    console.log('Server listening on port 3000.');
});