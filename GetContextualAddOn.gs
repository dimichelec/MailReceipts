/**
 * Returns the contextual add-on data that should be rendered for
 * the current e-mail thread. This function satisfies the requirements of
 * an 'onTriggerFunction' and is specified in the add-on's manifest.
 * 
 * @param {Object} event Event containing the message ID and other context.
 * @returns {Card[]}
 */
function getContextualAddOn(event) {
  var message = getCurrentMessage(event);
  var message_id = message.getId();
  var from = getFrom(message);
  var from_name = from[0];
  var from_domain = from[1];
  var email_data = getEmailData(message);

  var date = getReceivedDate(message).replace(',','');
  var amount = getLargestAmount(message);
  var merchant = from[0] + '|' + from[1];
  var payment_type = '';

  if(from_domain == '@toasttab.com') {
    merchant = 'Toast|' + from_name;
  } else if (from_domain == '@craftcloud3d.com') {
    merchant = 'Craftcloud';
    amount = '$'+ (/.*\|USD (\d+.\d\d)\|/.exec(email_data)[1]);
  } else if (from_domain == '@uber.com') {
    logData(email_data);
    tmp = /Total\|([$0-9.]+)(\w{3})\w+ (\d+)[, ]+(\d+)/.exec(email_data);
    amount = tmp[1];
    date = tmp[2] + ' ' + tmp[3] + ' ' + tmp[4];
    tmp = /Payments(?:<[^>]*>[^<]*<[^>]*><[^>]*>)([^=]+) (?:=E2=80=A2){4}(\d{4})/.exec(email_data);
    payment_type = tmp[1] + ' x' + tmp[2];
    merchant = 'Uber';
  } else if (from_domain == '@messaging.squareup.com') {
    tmp = new RegExp(/You paid ([$0-9.]+) /.source
                   + /with your (.*) ending in (\d+) /.source
                   + /to ([^\|]+) /.source
                   + /on (\w+ \d+ \d+) at .*/.source).exec(email_data);
    amount = tmp[1];
    payment_type = tmp[2] + ' x' + tmp[3];
    merchant = 'Square|' + tmp[4];
    date = tmp[5];
  } else if (from_domain == '@accts.epicgames.com') {
    tmp = /Order Date:\|Source:\|(\w{3})\w+ (\d+)[, ]+(\d+)/.exec(email_data);
    date = tmp[1] + ' ' + tmp[2] + ' ' + tmp[3];
    amount = '$' + /TOTAL \[ USD \]:\|[$ ]+([\d.]+)/.exec(email_data)[1];
    merchant = 'Epic';
  } else if (from_domain == '@e-confirmation.dominos.com') {
    tmp = /\|Date: [^,]+, (\d+) (\w+) (\d+)/.exec(email_data);
    date = tmp[2] + ' ' + tmp[1] + ' ' + tmp[3];
    payment_type = /\|Payment Method: \|+([\s\w]+) \$/.exec(email_data)[1];
    amount = /\|+Total: ([$\d.]+)/.exec(email_data)[1];
    merchant = "Domino's Pizza";
  } else if (from_domain == '@eat.grubhub.com') {
    tmp = new RegExp(/"Product",\|"name":"([^"]+)".*/.source
                   + /Total charge\s+([$\d.]+.*)/.source
                   + /Payment Method\s+([^-]+) - (\d+)/.source).exec(email_data);
    merchant = 'GrubHub|' + tmp[1]
    amount = tmp[2]
    payment_type = tmp[3] + ' x' + tmp[4]
  }

  var link = '=hyperlink("https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox/' + message_id + '", "link")';
  var spreadsheet = getSheetUrl();

  var card = createExpensesCard(
    [date, amount, merchant, payment_type],
    [link, email_data, spreadsheet, message_id]);

  return [card.build()];
}

function logData(data) {
  var len = data.length;
  var chunk = 5000;
  var j = 0;
  for(var i=0; i<len; i+=chunk) {
    console.log(j++ + ':' + data.substring(i, i+chunk));
  }
}

/**
 * Retrieves the current message given an action event object.
 *
 * @param {Event} event Action event object
 * @return {Message}
 */
function getCurrentMessage(event) {
  var accessToken = event.messageMetadata.accessToken;
  var messageId = event.messageMetadata.messageId;

  GmailApp.setCurrentMessageAccessToken(accessToken);

  return GmailApp.getMessageById(messageId);
}
