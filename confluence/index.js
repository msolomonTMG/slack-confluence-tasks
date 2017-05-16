var confluence = require('./confluence')

module.exports = {
  getTasks: confluence.getTasks,
  testCredentials: confluence.testCredentials
}
