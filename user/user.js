var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
  confluenceCredentials: String,
  slackUsername: String,
  randomString: String,
  timeZone: String
});

var User = mongoose.model('Users', userSchema);

var helpers = {
  createRandomString: function() {
    let randomString = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = 20;

    for( let i=0; i < length; i++ )
        randomString += possible.charAt(Math.floor(Math.random() * possible.length));

    return randomString;
  }
}

var functions = {
  deleteAll: function() {
    return new Promise(function(resolve, reject) {
      User.remove({},function(success) {
        return resolve(success)
      })
    });
  },
  create: function(userObj) {
    console.log('GOT USER OBJ', userObj)
    return new Promise(function (resolve, reject) {
      if (!userObj.confluenceCredentials || !userObj.slackUsername || !userObj.timezone) {
        return reject({
          error: {
            msg: 'User must have slack username, confluence credentials and timezone set'
          }
        })
      } else {
        newUser = new User ({
          confluenceCredentials: userObj.confluenceCredentials,
          slackUsername: userObj.slackUsername,
          randomString: helpers.createRandomString(),
          timeZone: userObj.timezone
        });
        console.log(newUser)
        newUser.save(function (err, user) {
          if (err) {
            return reject(err)
          } else {
            return resolve(user)
          }
        });
      }
    })
  },
  update: function(mongoId, updates) {
    console.log('I AM UPDATING USER ' + mongoId)
    return new Promise(function(resolve, reject) {
      User.update(
        { _id: mongoId },
        { $set: updates },
        function(err, result) {
          if (err) {
            return reject(err);
          } else {
            User.findOne({
              _id: mongoId
            }, function(err, user) {
              if(!err) {
                return resolve(user)
              } else {
                return reject(err)
              }
            })
          }
        }
      );
    })
  },
  getBySlackUsername: function(slackUsername) {
    return new Promise(function(resolve, reject) {
      User.findOne({
        slackUsername: slackUsername
      }, function(err, user) {
        if(!err) {
          return resolve(user)
        } else {
          return reject(err)
        }
      })
    });
  },
  getByTimeZone: function(timeZone) {
    return new Promise(function(resolve, reject) {
      User.find({
        timeZone: timeZone
      }, function(err, users) {
        if(!err) {
          return resolve(users)
        } else {
          return reject(err)
        }
      })
    });
  },
  getAll: function() {
    return new Promise(function(resolve, reject) {
      User.find({}, function(err, users) {
        if(!err) {
          return resolve(users)
        } else {
          return reject(err)
        }
      })
    });
  }
}


module.exports = functions;
