'use strict';

const
  bodyParser = require('body-parser'),
  express = require('express'),
  exphbs = require('express-handlebars'),
  user = require('./user'),
  slackbot = require('./slackbot'),
  confluence = require('./confluence'),
  utilities = require('./utilities'),
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

app.get('/test', function(req, res) {
  user.getAll().then(users => {
    res.send(users)
  })
  // user.getByTimeZone('PT').then(users => {
  //   res.send(users)
  // })
})

// temp route used to set all timezones for users
app.get('/set-time-zones', function(req, res) {
  user.getAll().then(users => {
    users.forEach(thisUser => {
      user.update(thisUser._id, {
        timeZone: 'ET'
      })
    })
  })
})

app.get('/delete', function(req, res) {
  user.deleteAll().then(success => {
    console.log(success)
  })
})

app.post('/user/update', function(req, res) {
  let updatedUserInfo = {
    confluenceCredentials: new Buffer(`${req.body.confluence.username}:${req.body.confluence.password}`).toString('base64'),
    slackUsername: req.body.slack.username,
    timeZone: req.body.timeZone
  }
  user.getBySlackUsername(updatedUserInfo.slackUsername).then(existingUser => {
    console.log(existingUser)
    user.update(existingUser._id, updatedUserInfo).then(updatedUser => {
      console.log(updatedUser)
      let confluenceUsername = Buffer.from(updatedUser.confluenceCredentials, 'base64').toString('ascii').split(':')[0]
      let confluencePassword = Buffer.from(updatedUser.confluenceCredentials, 'base64').toString('ascii').split(':')[1]
      utilities.formatUserTimeZone(updatedUser.timeZone).then(userTimeZone => {
        res.render('settings', {
          slackUsername: updatedUser.slackUsername,
          confluenceUsername: confluenceUsername,
          confluencePassword: confluencePassword,
          timeZoneET: userTimeZone.timeZoneET,
          timeZonePT: userTimeZone.timeZonePT,
          timeZoneCET: userTimeZone.timeZoneCET,
          signUpSuccessMsg: 'User Info Updated!'
        })
      })
    })
  })
})

app.post('/user/create', function(req, res) {
  let newUser = {
    confluenceCredentials: new Buffer(`${req.body.confluence.username}:${req.body.confluence.password}`).toString('base64'),
    slackUsername: req.body.slack.username,
    timeZone: req.body.timeZone
  }
  console.log(newUser)
  confluence.testCredentials(newUser.confluenceCredentials).then(success => {
    if (!success) {
      return res.sendStatus(403)
    } else {
      user.create(newUser).then(createdUser => {
        let confluenceUsername = Buffer.from(createdUser.confluenceCredentials, 'base64').toString('ascii').split(':')[0]
        let confluencePassword = Buffer.from(createdUser.confluenceCredentials, 'base64').toString('ascii').split(':')[1]
        utilities.formatUserTimeZone(createdUser.timeZone).then(createdUserTimeZone => {
          res.render('settings', {
            slackUsername: createdUser.slackUsername,
            confluenceUsername: confluenceUsername,
            confluencePassword: confluencePassword,
            timeZoneET: createdUserTimeZone.timeZoneET,
            timeZonePT: createdUserTimeZone.timeZonePT,
            timeZoneCET: createdUserTimeZone.timeZoneCET,
            signUpSuccessMsg: 'Signup Successful!'
          })
        })
      }).catch(err => {
        console.log(err)
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
