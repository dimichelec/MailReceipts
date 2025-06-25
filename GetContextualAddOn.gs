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
  var email_data = getEmailData(message);

  var card
  try {
    var fields = parseEmail(message);
    card = createExpensesCard(
      fields.concat(getSpreadsheetUrl()).concat(getForwardAddress()),
      [ getTrashReceiptOnSubmit(), getCleanupSpreadsheet() ],
      [ message_id, email_data ],
      null);
  }
  catch(e) {
    card = createExpensesCard(
      null,
      [ getTrashReceiptOnSubmit(), getCleanupSpreadsheet() ],
      [ message_id, email_data ],
      'Parsing Error: ' + e);
  }
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
