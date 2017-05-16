'use strict';

var request = require('request')

var functions = {
  getTasks: function(credentials) {
    return new Promise(function(resolve, reject) {
      let options = {
        url: `${process.env.CONFLUENCE_URL}/rest/mywork/latest/task`,
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      }
      request(options, function(error, response, body) {
        if(!error) {
          return resolve(JSON.parse(body))
        } else {
          return reject(error)
        }
      })
    })
  }
}


module.exports = functions;
