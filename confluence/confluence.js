'use strict';

var request = require('request')

var helpers = {
  makeConfluenceRequest: function(credentials, uri) {
    return new Promise(function(resolve, reject) {
      let options = {
        url: `${process.env.CONFLUENCE_URL}/${uri}`,
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      }
      request(options, function(error, response, body) {
        console.log(response.statusCode)
        if(response.statusCode === 200) {
          return resolve(JSON.parse(body))
        } else {
          return reject(error)
        }
      })
    });
  }
}

var functions = {
  getTasks: function(credentials) {
    return new Promise(function(resolve, reject) {
      helpers.makeConfluenceRequest(credentials, 'rest/mywork/latest/task')
        .then(tasks => {
          return resolve(tasks)
        })
        .catch(err => {
          return reject(err)
        })
    })
  },
  testCredentials: function(credentials) {
    console.log('test creds', credentials)
    return new Promise(function(resolve, reject) {
      helpers.makeConfluenceRequest(credentials, 'rest/api/user/current')
        .then(user => {
          console.log('successful test')
          console.log(user)
          return resolve(user)
        })
        .catch(err => {
          return reject(err)
        })
    });
  }
}


module.exports = functions;
