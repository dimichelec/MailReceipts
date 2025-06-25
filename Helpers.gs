
const geminiModel  = 'gemini-2.5-flash';
const geminiUrl    = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;


function callGemini(prompt) {
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const options = { 
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true  // Ensures we can inspect the response even on error
  };
  const response = UrlFetchApp.fetch(geminiUrl, options);
  if (response.getResponseCode() !== 200)
    return null;

  const data = JSON.parse(response.getContentText());
  const content = data["candidates"][0]["content"]["parts"][0]["text"];
  return content;
}

function getEmailData(message) {
  var tmp = message.getRawContent().split(/\r?\n/);
  var out = '';
  tmp.forEach(function(line) {
    line = line.trim();
    if(line != '') out += line + '|'
  });
  // get rid of some non-body stuff
  out = out.replace(/^.*?\|Content-T[^|]+\|/,'');
  // get rid of some HTML markup stuff
  out = out.replace(/<style[^>]+>.*?<\/style>/,'');
  TAGS = ['a','b','strong','div','p','span','br','table','tbody','th','tr','td','img']
  TAGS.forEach(function(tag) {
    var re = new RegExp('<' + tag + '[^>]*>|<\/' + tag + '>','gmi');
    out = out.replace(re,'');  
  })
  // more clean-up
  out = out.replace(/=\|/gm,'');
  out = out.replace(/\|\|+/gm,'|');
  return out;
}

/**
 * Get the message's from name and domain.
 * 
 * @param {Message} message An email message.
 * @returns {String[]} from_name, from_domain
 */
function getFrom(message) {
  var from = message.getFrom().replace(/"/g,'');
  if (from.indexOf('<') < 0)
    return [ 'me', from ]
  return /([^<]+)\s<[^@]+(\@[^>]+)/.exec(from).slice(1,3);
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
  var str = message.getDate().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric' });
  var tmp;
  if(str.indexOf('/') >= 0) {
    tmp = str.split("/");
  } else {
    tmp = str.split(" ");
  }
  date = tmp[0].substring(0,3) + ' ' + tmp[1] + ' ' + tmp[2]
  return date;
}

/**
 * Using a key string, get the value following it, up to a '\n'.
 * If the key isn't found in the input text, return the passed-in
 * default_value.
 * 
 * @param {String} default_value returned if key isn't found
 * @param {String} text the key/value text to search thru
 * @param {String} key the key being searched for
 * @returns {String}
 */
function extractKey(default_value, text, key) {
    var pos = text.indexOf(key);
    if (pos >= 0) {
      var end = text.indexOf('\n', pos);
      if (end < 0) end = text.length;
      var value = text.substring(pos + key.length, end).trim();
      if (value != "") return value;
    }
    return default_value;
}

/**
 * Determines most recent spreadsheet URL.
 * Returns null if no URL was previously submitted.
 * 
 * @returns {String}
 */
function getSpreadsheetUrl() {
  return PropertiesService.getUserProperties().getProperty('SPREADSHEET_URL');
}

function getForwardAddress() {
  return PropertiesService.getUserProperties().getProperty('FORWARD_ADDRESS');
}

function getTrashReceiptOnSubmit() {
  return PropertiesService.getUserProperties().getProperty('TrashReceiptOnSubmit');
}

function getCleanupSpreadsheet() {
  return PropertiesService.getUserProperties().getProperty('CleanupSpreadsheet');
}


