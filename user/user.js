var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
  confluenceCredentials: String,
  slackUsername: String
});

var User = mongoose.model('Users', userSchema);

var functions = {
  create: function(userObj) {
    console.log('GOT USER OBJ', userObj)
    return new Promise(function (resolve, reject) {
      if (!userObj.confluenceCredentials || !userObj.slackUsername) {
        return reject({
          error: {
            msg: 'User must have confluence credentials and slack username'
          }
        })
      } else {
        newUser = new User ({
          confluenceCredentials: userObj.confluenceCredentials,
          slackUsername: userObj.slackUsername
        });
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
