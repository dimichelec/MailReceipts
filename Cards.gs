var FIELDNAMES1 = ['Date', 'Amount', 'Merchant', 'Payment Type'];
var FIELDNAMES2 = ['Link', 'Debug', 'Spreadsheet URL', 'MessageID'];   // Spreadsheet URL & MessgaeID need to be last

/**
 * Creates the main card users see with form inputs to log expenses.
 * Form can be prefilled with values.
 * 
 * @param {String[]} opt_prefills Default values for each input field.
 * @param {String} opt_staus Optional status displayed at top of card.
 * @returns {Card}
 */
function createExpensesCard(opt_prefills1, opt_prefills2, opt_status) {
  var card = CardService.newCardBuilder();

  if (opt_status) {
    if (opt_status.indexOf('Error: ') == 0) {
      opt_status = '<font color=\'#FF0000\'>' + opt_status + '</font>';
    } else {
      opt_status = '<font color=\'#228B22\'>' + opt_status + '</font>';
    }
    var statusSection = CardService.newCardSection();
    statusSection.setHeader(CardService.newCardHeader().setTitle('Receipt Data'));
    statusSection.addWidget(CardService.newTextParagraph()
      .setText('<b>' +  opt_status + '</b>'));
    card.addSection(statusSection);
  }

  card.addSection(createMainFormSection(
    CardService.newCardSection().setHeader('Receipt Data'), FIELDNAMES1, opt_prefills1)
  );

  card.addSection(createAdvancedFormSection(
    CardService.newCardSection().setHeader('Advanced'), FIELDNAMES2, opt_prefills2)
  );

  card.addSection(createButtonSection(CardService.newCardSection()));

  return card;
}

/**
 * Creates form section to be displayed on card.
 * 
 * @param {CardSection} section The card section to which form items are added.
 * @param {String[]} inputNames Names of titles for each input field.
 * @param {String[]} opt_prefills Default values for each input field.
 * @returns {CardSection}
 */
function createMainFormSection(section, inputNames, opt_prefills) {
  for (var i = 0; i < inputNames.length; i++) {
    var widget = CardService.newTextInput()
      .setFieldName(inputNames[i])
      .setTitle(inputNames[i]);
    if (opt_prefills && opt_prefills[i]) {
      widget.setValue(opt_prefills[i]);
    }
    section.addWidget(widget);
  }
  return section;
}

function createAdvancedFormSection(section, inputNames, opt_prefills) {
  section.setCollapsible(true);

  var spreadsheet;

  for (var i = 0; i < inputNames.length; i++) {
    var widget = CardService.newTextInput()
      .setFieldName(inputNames[i])
      .setTitle(inputNames[i]);
    if (opt_prefills && opt_prefills[i]) {
      widget.setValue(opt_prefills[i]);
      if (inputNames[i] == 'Spreadsheet URL') spreadsheet = opt_prefills[i];
    }
    section.addWidget(widget);
  }

  if (spreadsheet) {
    var widget = CardService.newDecoratedText()
      .setStartIcon(CardService.newIconImage()
          .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/format_list_numbered_black_24dp.png'))
      .setText('Spreadsheet')
      .setOpenLink(CardService.newOpenLink()
          .setUrl(spreadsheet)
          .setOpenAs(CardService.OpenAs.OVERLAY));
    section.addWidget(widget);
  }
  return section;
}

function createButtonSection(section) {
  var submitForm = CardService.newAction().setFunctionName('submitForm');
  var submitTrashForm = CardService.newAction().setFunctionName('submitTrashForm');
  var buttonSet = CardService.newButtonSet()
  .addButton(
    CardService.newTextButton()
      .setText('Submit')
      .setOnClickAction(submitForm)
  )
  .addButton(
    CardService.newTextButton()
      .setText('Submit and Trash')
      .setOnClickAction(submitTrashForm)
  );
  section.addWidget(buttonSet);
  return section;
}

