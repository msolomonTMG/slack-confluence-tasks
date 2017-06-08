'use strict';

const
  bodyParser = require('body-parser'),
  express = require('express'),
  exphbs = require('express-handlebars'),
  user = require('./user'),
  slackbot = require('./slackbot'),
  confluence = require('./confluence'),
  mongoose = require('mongoose'),
  MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mongo_test";

mongoose.connect(MONGO_URI, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + MONGO_URI + '. ' + err);
  } else {
  console.log ('Succeeded connected to: ' + MONGO_URI);
  }
});

var app = express();
app.set('port', process.env.PORT || 5000);
//app.use('/settings', express.static('public'))

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/signup', function(req, res) {
  res.render('signup');
})

app.get('/settings', function(req, res) {
  if (!req.query.slackUsername) {
    res.send(403)
  }
  user.getBySlackUsername(req.query.slackUsername).then(thisUser => {
    if (!thisUser) {
      res.send(403)
      return false
    }
    if (thisUser.randomString == req.query.rs) {
      res.render('settings', {
        slackUsername: req.query.slackUsername
      })
    } else {
      res.send(403)
    }
    // confluence.getTasks(user.confluenceCredentials).then(tasks => {
    //   console.log('found tasks', tasks)
    // })
  })
})

app.post('/msg-wake-up', function(req, res) {
  if (req.body.challenge) {
    res.send(req.body.challenge)
  } else {
    //wake up!
    console.log('Im up!')
    res.send(200)
  }
})

app.post('/user/create', function(req, res) {
  let newUser = {
    confluenceCredentials: new Buffer(`${req.body.confluence.username}:${req.body.confluence.password}`).toString('base64'),
    slackUsername: req.body.slack.username,
    timeZone: req.body.timezone
  }
  console.log(newUser)
  confluence.testCredentials(newUser.confluenceCredentials).then(success => {
    if (!success) {
      return res.sendStatus(403)
    } else {
      user.create(newUser).then(createdUser => {
        res.render('settings', {
          slackUsername: createdUser.slackUsername,
          signUpSuccessMsg: 'Signup Successful!'
        })
      }).catch(err => {
        return res.sendStatus(422)
      })
    }
  }).catch(err => {
    res.render('signup', {
      error: {
        msg: 'There was an error signing up. Check your Confluence credentials.'
      }
    });
  })
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
module.exports = app;
