/**
 * Logs form inputs into a spreadsheet given by URL from form.
 * Then displays edit card.
 * 
 * @param {Event} e An event object containing form inputs and parameters.
 * @returns {Card}
 */
function submitForm(e) {
  var res = e['formInput'];
  res['Amount'] = fixAmount(res['Amount']);
  var err = PostFormData(res);
  if (err == null) {
    TrashEmail(res['MessageID'], false);
    return createExpensesCard(null, null, 'Logged expense successfully!').build();
  }
  return submitError(err, res);
}

function submitTrashForm(e) {
  var res = e['formInput'];
  res['Amount'] = fixAmount(res['Amount']);
  var err = PostFormData(res, true);
  if (err == null) {
    TrashEmail(res['MessageID'], true);
    return createExpensesCard(null, null, 'Logged expense successfully!').build();
  }
  return submitError(err, res);
}

function submitError(err, res) {
  if (err == 'Exception: Invalid argument: url') {
    err = 'Invalid URL';
    res['Spreadsheet URL'] = null;
  }
  return createExpensesCard(
    objToArray(res, FIELDNAMES1),
    objToArray(res, FIELDNAMES2),
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

function PostFormData(res) {
  try {
    var all_fieldnames = FIELDNAMES1.concat(FIELDNAMES2);
    all_fieldnames.forEach(function(fieldName) {
      if (!res[fieldName]) {
        throw 'incomplete form [' + fieldName + ']';
      }
    });
    var sheet = SpreadsheetApp
      .openByUrl((res['Spreadsheet URL']))
      .getActiveSheet();
    
    // make a blank cell in column 1 for a checkbox and pop
    // the Spreadsheet URL and MessageID fields from the list 
    // to not add them to the spreadsheet row
    var ary = [ '' ].concat(objToArray(res, all_fieldnames));
    ary.pop();
    ary.pop();
    var row = sheet.appendRow(ary).getLastRow();
    sheet.getRange(row, 1).insertCheckboxes("N");
    sheet.setRowHeightsForced(row, 1, 21);

    PropertiesService.getUserProperties().setProperty(
      'SPREADSHEET_URL',
      res['Spreadsheet URL']);

    return null;
  }
  catch(err) { return err; }
}

/**
 * Returns an array corresponding to the given object and desired ordering of keys.
 * 
 * @param {Object} obj Object whose values will be returned as an array.
 * @param {String[]} keys An array of key names in the deired order.
 * @returns {Object[]}
 */
function objToArray(obj, keys) {
  return keys.map(function(key) {
    return obj[key];
  });
}

function TrashEmail(message_id, trash) {
    var message = GmailApp.getMessageById(message_id);

    var label = GmailApp.getUserLabelByName("Receipts");
    message.getThread().addLabel(label);

    if(trash) GmailApp.moveMessageToTrash(message);
}

