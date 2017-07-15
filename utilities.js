var helpers = {

}

var functions = {
  formatUserTimeZone: function(userTimeZone) {
    return new Promise(function(resolve, reject) {
      let options = {
        timeZoneET: false,
        timeZonePT: false,
        timeZoneCET: false
      }
      switch(userTimeZone) {
        case 'ET':
          options.timeZoneET = true
        break;
        case 'PT':
          options.timeZonePT = true
        break;
        case 'CET':
          options.timeZoneCET = true
        break;
        default:
          options.timeZoneET = true
      }
      return resolve(options)
    });
  }
}


module.exports = functions;
