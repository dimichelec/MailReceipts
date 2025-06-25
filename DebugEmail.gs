function sendDebugEmail(event) {

  var ep = event.parameters;

  GmailApp.sendEmail('dimichelec@gmail.com', 'MailReceipts debug info', ep.debug_body);

  var res = event['formInput'];
  res['Date'] = Utilities.formatDate(new Date(res['Date']['msSinceEpoch']), 'GMT', 'MMM d yyyy');

  return createExpensesCard(
    objToArray(res, textFIELDNAMES),
    [ res['Trash Receipt'], res['Cleanup Spreadsheet'] ],
    [ ep.message_id, ep.email_data ],
    'Debug email sent!').build();
}

function formatDebugBody(prefills, message_id, email_data) {

  var body = '';
  if (message_id) {
    body += 'message_id:\n'
        + message_id + '  [link: https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox/' + message_id + ']\n'
        + '------------------------------------------------------------------------------------\n';
  }
  if (prefills) {
    for (var i = 0; i < textFIELDNAMES.length; i++) {
      if (prefills[i]) {
        body += textFIELDNAMES[i] + ':\n'
            + prefills[i].trim()
            + '\n------------------------------------------------------------------------------------\n';
      }
    }
  }
  if (email_data) {
    body += 'email_data [' + email_data.length + ' bytes]:\n'
        + email_data.substring(0, 16384)
        + '\n------------------------------------------------------------------------------------\n';
  }
  return body;
}

