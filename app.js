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
app.use('/settings', express.static('public'))

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function(req, res) {
  res.render('signup');
})

app.get('/slack', function(req, res) {
  slackbot.postMessageToUser('mike', 'this is a test').then(success => {
    res.send(200)
  })
})

app.get('/full', function(req, res) {
  user.getBySlackUsername('mike').then(thisUser => {
    confluence.getTasks(thisUser.confluenceCredentials).then(tasks => {
      slackbot.sendTasksToUser('mike', tasks).then(success => {
        res.send(200)
      })
    })
  })
})

app.get('/test', function(req, res) {
  user.getBySlackUsername('mike.solomon').then(user => {
    console.log('found user', user)
    confluence.getTasks(user.confluenceCredentials).then(tasks => {
      console.log('found tasks', tasks)
    })
  })
})

app.post('/user/create', function(req, res) {
  let newUser = {
    confluenceCredentials: new Buffer(`${req.body.confluence.username}:${req.body.confluence.password}`).toString('base64'),
    slackUsername: req.body.slack.username
  }
  console.log(newUser)
  confluence.testCredentials(newUser.confluenceCredentials).then(success => {
    if (!success) {
      return res.sendStatus(403)
    } else {
      user.create(newUser).then(createdUser => {
        return res.sendStatus(201)
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
