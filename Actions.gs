
/**
 * This can be called by the form to clear a field, or all fields, with
 * the touch of a button.
 * 
 * The parameter, fieldsToClear is a string containing either the fieldname
 * (one of textFIELDNAMES) or '*' to clear all fields.
 * 
 * @param {Event} e An event object containing form inputs and parameters.
 * @returns {Card}
 */
function clearFields(e) {
  var res = e['formInput'];

  // convert date to a string, if it is a msSinceEpoch object
  if (typeof res['Date'] === 'object' && res['Date'] !== null && 'msSinceEpoch' in res['Date']) {
    //widget.setValueInMsSinceEpoch(textPrefills[i].msSinceEpoch);
    var date = new Date(res['Date'].msSinceEpoch);
    res['Date'] = date.toLocaleDateString(
      'en-US',
      { timeZone: 'GMT', month: 'short', day: 'numeric', year: 'numeric' }
    ).replace(',', '');
  }

  var field = e.parameters.fieldsToClear;
  if (field == '*')
  {
    // clear all fields
    res['Date'] = res['Amount'] = res['Merchant'] = res['Payment Type'] = '';
  
  } else {
    res[field] = '';

    // Payment Type defaults to 'Discover' in the case of an actual blank,
    // "**" forces a blank.
    if (field == 'Payment Type') res[field] = '**';
  }
  
  return createExpensesCard(
    objToArray(res, textFIELDNAMES),
    [ res['Trash Receipt'], res['Cleanup Spreadsheet'] ],
    [ e.parameters.message_id, e.parameters.email_data ]).build();
}

function setDefaultCard(e) {
  var res = e['formInput'];

  res['Date'] = '';   // This signals the form to use DatePicker (date not being a string)

  res['Payment Type'] = defaultCard;
  
  return createExpensesCard(
    objToArray(res, textFIELDNAMES),
    [ res['Trash Receipt'], res['Cleanup Spreadsheet'] ],
    [ e.parameters.message_id, e.parameters.email_data ]).build();
}

/**
 * Logs form inputs into a spreadsheet given by URL from form.
 * Then displays edit card.
 * 
 * @param {Event} e An event object containing form inputs and parameters.
 * @returns {Card}
 */
function submitForm(e) {
  var res = e['formInput'];
  if (res['Cleanup Spreadsheet'] == 'yes') cleanupSpreadsheet(res['Spreadsheet URL']);
  res['Amount'] = fixAmount(res['Amount']);
  res['Date'] = Utilities.formatDate(new Date(res['Date']['msSinceEpoch']), 'GMT', 'MMM d yyyy');

  var err = postFormData(res, e.parameters.message_id);
  if (err == null) {
    processEmail(e.parameters.message_id,
      (e.parameters.forward_flag == "1") ? res['Forward Address'] : null,
      (res['Trash Receipt'] == 'yes'));
    return createExpensesCard(
      objToArray(res, textFIELDNAMES),
      [ res['Trash Receipt'], res['Cleanup Spreadsheet'] ],
      [ e.parameters.message_id, e.parameters.email_data ],
      'Logged expense successfully!').build();
  }

  if (err == 'Exception: Invalid argument: url') {
    err = 'Invalid URL';
    res['Spreadsheet URL'] = null;
  }
  return createExpensesCard(
    objToArray(res, textFIELDNAMES),
    [ res['Trash Receipt'], res['Cleanup Spreadsheet'] ],
    [ e.parameters.message_id, e.parameters.email_data ],
    'Error: ' + err).build();
}

function fixAmount(inp) {
  try {
    var amount = inp;
    if (amount != '') amount = amount.replace('$','').trim();
    if (amount != '')
      if (isNaN(parseFloat(amount).toFixed(2)))
          amount = '$0.00'
      else
          amount = '$' + parseFloat(amount).toFixed(2);
    return amount;
  }
  catch(e) {
    return null;
  }
}

function postFormData(res, message_id) {
  try {
    var all_fieldnames = textFIELDNAMES;
    all_fieldnames.forEach(function(fieldName) {
      if (!res[fieldName]) throw 'incomplete form [' + fieldName + ']';
    });
    var sheet = SpreadsheetApp
      .openByUrl((res['Spreadsheet URL']))
      .getActiveSheet();
    
    // make a blank cell in column 1 for a checkbox and replace the last field
    // with a link to the receipt email
    var ary = [ '' ].concat(objToArray(res, all_fieldnames));
    ary.pop();
    ary.pop();
    ary = ary.concat(
      "=hyperlink(\"https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox/"
      + message_id + "\", \"link\")");

    var row = sheet.appendRow(ary).getLastRow();
    sheet.getRange(row, 1).insertCheckboxes("N");
    sheet.setRowHeightsForced(row, 1, 21);

    PropertiesService.getUserProperties().setProperty(
      'SPREADSHEET_URL',
      res['Spreadsheet URL']);

    PropertiesService.getUserProperties().setProperty(
      'FORWARD_ADDRESS',
      res['Forward Address']);

    PropertiesService.getUserProperties().setProperty(
      'TrashReceiptOnSubmit',
      (res['Trash Receipt']) ? res['Trash Receipt'] : '');

    PropertiesService.getUserProperties().setProperty(
      'CleanupSpreadsheet',
      (res['Cleanup Spreadsheet']) ? res['Cleanup Spreadsheet'] : '');

    return null;
  }
  catch(err) { return err; }
}

/**
 * Returns an array corresponding to the given object and desired ordering of keys.
 * 
 * @param {Object} obj Object whose values will be returned as an array.
 * @param {String[]} keys An array of key names in the desired order.
 * @returns {Object[]}
 */
function objToArray(obj, keys) {
  return keys.map(function(key) {
    return obj[key];
  });
}

/**
 * Takes the ID of our receipt email, add the 'Receipts' label to it, forwards it to another address
 * if that parameter is valid, and moves it to trash if we flagged that operation.
 * 
 * @param {String} message_id ID of the email message receipt we are processing
 * @param {Boolean} trash Flag telling us whether to move the email to trash after processing.
 */
function processEmail(message_id, forward_address, trash) {
  var message = GmailApp.getMessageById(message_id);
  var label = GmailApp.getUserLabelByName("Receipts");
  message.getThread().addLabel(label);
  if(forward_address) message.forward(forward_address);
  if(trash) {
    GmailApp.moveMessageToTrash(message);
  }
}

function cleanupSpreadsheet(spreadsheetURL) {
    var sheet = SpreadsheetApp
      .openByUrl(spreadsheetURL)
      .getActiveSheet();
    var test = true;
    while (test) {
      test = false;
      for (var row = 1; row <= sheet.getLastRow(); row++)
        if (sheet.getRange(row, 1).getValue() != '')
        {
          sheet.deleteRow(row);
          test = true;
        }
    }
}
