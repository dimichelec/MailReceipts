
function getEmailData(message) {
  var tmp = message.getRawContent().split(/\r?\n/);
  var out = '';
  tmp.forEach(function(line) {
    line = line.trim();
    if(line != '') out += line + '|'
  });
  // get rid of HTML markup stuff
  //out = out.replace(/<style.*<\/style>/,'');
  TAGS = ['a','b','strong','div','p','span','br','table','tbody','th','tr','td','img']
  TAGS.forEach(function(tag) {
    var re = new RegExp('<' + tag + '[^>]*>|<\/' + tag + '>','gmi');
    out = out.replace(re,'');  
  })
  out = out.replace(/=\|/gmi,'');
  out = out.replace(/\|\|+/gm,'|');
  out = out.replace(/\r?\n/gm, '');
  out = out.replace(/=2E/gm,'.');
  return out;
}

/**
 * Get the message's from name and domain.
 * 
 * @param {Message} message An email message.
 * @returns {String[]} from_name, from_domain
 */
function getFrom(message) {
  var from = /([^<]+)\s<[^@]+(\@[^>]+)/.exec(message.getFrom());
  return [ from[1], from[2] ]
}

/**
 * Finds largest dollar amount from email body.
 * Returns null if no dollar amount is found.
 * 
 * @param {Message} message An email message.
 * @returns {String}
 */
function getLargestAmount(message) {
  var amount = 0;
  var messageBody = message.getPlainBody();
  var regex = /\$[\d,]+\.\d\d/g;
  var match = regex.exec(messageBody);
  while (match) {
    amount = Math.max(amount, parseFloat(match[0].substring(1).replace(/,/g,'')));
    match = regex.exec(messageBody);
  }
  return amount ? '$' + amount.toFixed(2).toString() : null;
}

/**
 * Determines date the email was received.
 * 
 * @param {Message} message An email message.
 * @returns {String}
 */
function getReceivedDate(message) {
  var tmp = message.getDate().toLocaleDateString().split(" ");
  date = tmp[0].substring(0,3) + ' ' + tmp[1] + ' ' + tmp[2]
  return date;
}

/**
 * Determines most recent spreadsheet URL.
 * Returns null if no URL was previously submitted.
 * 
 * @returns {String}
 */
function getSheetUrl() {
  return PropertiesService.getUserProperties().getProperty('SPREADSHEET_URL');
}
