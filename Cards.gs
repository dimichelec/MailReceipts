var versionString = "v0.91";

var textFIELDNAMES = ['Date', 'Amount', 'Merchant', 'Payment Type', 'Spreadsheet URL', 'Forward Address'];
const defaultCard = "Discover";

/**
 * Creates the main card users see with form inputs to log expenses.
 * Form can be prefilled with values.
 */
function createExpensesCard(textPrefills, otherPrefills, passthrus, status) {
  var card = CardService.newCardBuilder();
  var message_id = (passthrus) ? passthrus[0] : null;
  var email_data = (passthrus) ? passthrus[1] : null;
  var widget;
  var paymentsValue;
  var clearField = null;

  // add a status line if one was sent in
  if (status) {
    status = '<font color=\''
       + ((status.indexOf('Error: ') < 0) ? '#228B22' : '#FF0000')
       + '\'>' + status + '</font>';
    var statusSection = CardService.newCardSection();
    statusSection.setHeader(CardService.newCardHeader().setTitle('Receipt Data'));
    statusSection.addWidget(CardService.newTextParagraph()
      .setText('<b>' + status + '</b>'));
    card.addSection(statusSection);
  }

  // add the main data section
  var section = CardService.newCardSection();

  // add CLEAR DATA button
  var clearFields = CardService.newAction().setFunctionName('clearFields');
  if (message_id)
    clearFields.setParameters({message_id: message_id, email_data: email_data, forward_flag: ""});

  // add Default Card button to end of Payment Type field
  var setDefaultCard = CardService.newAction().setFunctionName('setDefaultCard');
  if (message_id)
    setDefaultCard.setParameters({message_id: message_id, email_data: email_data, forward_flag: ""});

  section.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText('Clear Data')
        .setOnClickAction(clearFields.setParameters({fieldsToClear: '*'}))
    )
  );

  // add receipt data input fields
  for (var i = 0; i < textFIELDNAMES.length; i++) {

    clearField = null;

    // add a DatePicker for the date field
    if (textFIELDNAMES[i] == 'Date') {
      widget = CardService.newDatePicker()
        .setFieldName('Date');
      if (textPrefills && textPrefills[i]) {
        // data is a string like, "Jul 24 2025"
        widget.setValueInMsSinceEpoch(
          Utilities.parseDate(textPrefills[i],'GMT','MMM d yyyy').getTime()
        );
      } else {
        widget.setValueInMsSinceEpoch(new Date().getTime());
      }
      paymentsWidget = widget;
    
    } else if (textFIELDNAMES[i] == 'Payment Type') {

      // payment type has a default value of discover
      widget = CardService.newTextInput()
        .setFieldName(textFIELDNAMES[i])
        .setHint(textFIELDNAMES[i]);

      if (textPrefills && textPrefills[i]) {
        // a value of "**" signals an actual blank as requested by clearField,
        // a typical blank defaults to "Discover"
        if (textPrefills[i] == "**") {
          widget.setValue('');
          paymentsValue = '';
        } else {
          widget.setValue(textPrefills[i]);
          paymentsValue = textPrefills[i];
        }
      } else {
        widget.setValue('Discover');
        paymentsValue = 'Discover';
      }

      // make a clear button
      clearField = CardService.newTextButton()
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setMaterialIcon(CardService.newMaterialIcon().setName("delete"))
        .setOnClickAction(clearFields.setParameters({fieldsToClear: textFIELDNAMES[i]}));
        
    } else {

      // add TextInput fields for everything else
      widget = CardService.newTextInput()
        .setFieldName(textFIELDNAMES[i])
        .setHint(textFIELDNAMES[i]);

      if (textPrefills && textPrefills[i]) widget.setValue(textPrefills[i]);

      // Check if a clear button is needed
      if (textPrefills && textPrefills[i]) {
        clearField = CardService.newTextButton()
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setMaterialIcon(CardService.newMaterialIcon().setName("delete"))
          .setOnClickAction(clearFields.setParameters({fieldsToClear: textFIELDNAMES[i]}));
      }      
    }
    section.addWidget(widget);

    if(clearField)
      section.addWidget(clearField);

    if (textFIELDNAMES[i] == 'Payment Type' && paymentsValue != defaultCard) {
      section.addWidget(
        CardService.newTextButton()
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setText(defaultCard)
          .setOnClickAction(setDefaultCard)
      );
    }
  }

  // add Trash Receipt switch
  var wSwitch = CardService.newSwitch()
    .setFieldName('Trash Receipt')
    .setValue('yes');
  if (otherPrefills && otherPrefills[0])
    wSwitch.setSelected(otherPrefills[0] != '');

  widget = CardService.newDecoratedText()
    .setText('Trash Receipt')
    .setWrapText(true)
    .setSwitchControl(wSwitch);
  section.addWidget(widget);

  // add Cleanup Spreadsheet switch
  var wSwitch = CardService.newSwitch()
    .setFieldName('Cleanup Spreadsheet')
    .setValue('yes');
  if (otherPrefills && otherPrefills[1])
    wSwitch.setSelected(otherPrefills[1] != '');

  widget = CardService.newDecoratedText()
    .setText('Cleanup Spreadsheet')
    .setWrapText(true)
    .setSwitchControl(wSwitch);
  section.addWidget(widget);

  // add SUBMIT buttons
  var submitForm = CardService.newAction().setFunctionName('submitForm');
  var submitFormAndForward = CardService.newAction().setFunctionName('submitForm');
  if (message_id) {
    submitForm.setParameters({message_id: message_id, email_data: email_data, forward_flag: ""});
    submitFormAndForward.setParameters({message_id: message_id, email_data: email_data, forward_flag: "1"});
  }
  section.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText('Submit')
        .setOnClickAction(submitForm)
    )
  );
  section.addWidget(
    CardService.newButtonSet().addButton(
      CardService.newTextButton()
        .setText('Submit & Forward')
        .setOnClickAction(submitFormAndForward)
    )
  );
  card.addSection(section);

  // add Other Functions section (Spreadheet, Send Debug Email)
  card.addSection(otherFunctionsSection(textPrefills, message_id, email_data));

  mainCard = card;
  return card;
}


function otherFunctionsSection(textPrefills, message_id, email_data) {
  var section = CardService.newCardSection();
  var spreadsheet = getSpreadsheetUrl();
  if (spreadsheet) {
    var widget = CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage()
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/'
           +'format_list_numbered_black_24dp.png'))
      .setText('Spreadsheet')
      .setOpenLink(CardService.newOpenLink()
        .setUrl(spreadsheet)
        .setOpenAs(CardService.OpenAs.OVERLAY));
    section.addWidget(widget);
  }
  if (email_data) {
    var debug_body = formatDebugBody(textPrefills, message_id, email_data);
    var widget = CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage()
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/'
           +'bug_report_black_24dp.png'))
      .setText('Send Debug Email')
      .setOnClickAction(CardService.newAction()
        .setFunctionName('sendDebugEmail')
        .setParameters({
          debug_body: debug_body, message_id: message_id, email_data: email_data }));
    section.addWidget(widget);
  }

  section.addWidget(
    CardService.newTextParagraph()
      .setText(versionString)
  );
  return section;
}
