/**
 * Take a message object and parse-out date, amount, merchant, and payment type
 * based on it being a receipt email.
 * 
 * @param {Object} message A message object containing the receipt email
 * @returns {String[]} [ date, amount, merchant, payment_type ]
 */

function parseEmail(message) {
  var from = getFrom(message);
  var from_name = from[0];
  var from_domain = from[1];
  var email_data = getEmailData(message);

  var date = getReceivedDate(message).replace(',','');
  var amount = getLargestAmount(message);
  var merchant = from[0] + '|' + from[1];
  var payment_type = '';

  const geminiPrompt = `
    Extract the following details from the 'email_data' and 'from' fields of an email that might be a receipt. Prioritize information directly stated in the email body for accuracy.

    **Required Information:**
    1.  **Merchant:** Identify the name of the business or store the purchase was made from. Exclude stating any portion of the merchant name that might be the addition of a URL (e.g., "The Guardian Bookshop|@orders.guardianbookshop.com" should become "The Guardian Bookshop").
    2.  **Date:** Find the specific date the transaction occurred. Prioritize dates within the email body or subject line if multiple dates are present. State date in the format "MMM DD YYYY".
    3.  **Payment Method:** Specify the type of payment used (e.g., "Credit Card," "Visa," "PayPal"). If a specific card type isn't mentioned, state "Credit Card" or ""
    4.  **Amount:** Locate the final total amount paid. Include the currency symbol. If multiple totals are present, specify the amount charged by the payment method. IF THE AMOUNT IS NOT IN US DOLLARS CONVERT IT TO US DOLLARS.

    **Instructions:**
    * If a specific piece of information is not found, state ""
    * If there are multiple plausible dates, use the one most clearly associated with the transaction (e.g., "Order Date," "Date").
    * Be precise with currency symbols and amounts. If the amount is not in US dollars convert it to US dollars.

    **Input Data:**
    from: ${from}
    email_data: ${email_data}
  `

  var use_gemini = false;
  
  try {
    switch (from_domain) {
      case '@toasttab.com':
        tmp = /(?=\|Input Type\|[^|]+\|([^|]+)).*\|\1\|x{7}([^|]+).*Total:\|([^|]+)/.exec(email_data);
        if (tmp == null) {
          tmp = /\|Total\|([^|]+)\|(?:[^|]+\|){2}([^|]+)\|x{7}([^\|]+)/.exec(email_data);
          if (tmp == null)
            tmp = /\|Total\|([^|]+)\|(?:[^|]+\|){3}([^|]+)\|x{7}([^\|]+)/.exec(email_data);
          amount = tmp[1];
          payment_type = tmp[2] + ' ' + tmp[3];
        } else {
          payment_type = tmp[1] + ' ' + tmp[2];
          amount = tmp[3];
        }
        merchant = 'Toast|' + from_name;
        break;

      case '@craftcloud3d.com':
        merchant = 'Craftcloud';
        amount = '$'+ (/.*\|USD (\d+.\d\d)\|/.exec(email_data)[1]);
        break;

      case '@uber.com':
        tmp = /Total[=0D=0A\|]*([$0-9.]+)(\w{3})\w* (\d+)[, ]+(\d+)/.exec(email_data);
        amount = tmp[1];
        date = tmp[2] + ' ' + tmp[3] + ' ' + tmp[4];
        tmp = /Payments(?:&nbsp;)?(?:(?:<[^>]*>[^<]*)?<[^>]*><[^>]*>)?(?:<[^>]*>)?([^=]+) (?:=E2=80=A2){4}(\d{4})/.exec(email_data);
        //tmp = /Payments(?:&nbsp;)?(?:(?:<[^>]*>[^<]*)?<[^>]*><[^>]*>)?([^=]+) (?:=E2=80=A2){4}(\d{4})/.exec(email_data);
        payment_type = tmp[1] + ' x' + tmp[2];
        merchant = 'Uber';
        break;

      case '@messaging.squareup.com':
        tmp = new RegExp(/You paid ([$0-9.]+) /.source
                      + /with your (.*) ending in (\d+) /.source
                      + /to ([^\|]+) /.source
                      + /on (\w+ \d+ \d+) at .*/.source).exec(email_data);
        if (tmp == null) {
          tmp = new RegExp(/Receipt for ([$0-9.]+) /.source
                      + /at (.*) on (\w+ \d+ \d+) .*/.source
                      + / (Discover) (\d{4})/.source).exec(email_data); 
          merchant = 'Square|' + tmp[2];
          date = tmp[3];
          payment_type = tmp[4] + ' x' + tmp[5];
        } else {
          payment_type = tmp[2] + ' x' + tmp[3];
          merchant = 'Square|' + tmp[4];
          date = tmp[5];
        }
        amount = tmp[1];
        break;

      case '@accts.epicgames.com':
        tmp = /Order Date:\|Source:\|(\w{3})\w+ (\d+)[, ]+(\d+)/.exec(email_data);
        date = tmp[1] + ' ' + tmp[2] + ' ' + tmp[3];
        amount = '$' + /TOTAL \[ USD \]:\|[$ ]+([\d.]+)/.exec(email_data)[1];
        merchant = 'Epic';
        break;

      case '@e-confirmation.dominos.com':
        tmp = /\|Date: [^,]+, (\d+) (\w+) (\d+)/.exec(email_data);
        date = tmp[2] + ' ' + tmp[1] + ' ' + tmp[3];
        payment_type = /\|Payment Method: \|+([\s\w]+) \$/.exec(email_data)[1];
        amount = /\|+Total: ([$\d.]+)/.exec(email_data)[1];
        merchant = "Domino's Pizza";
        break;

      case '@eat.grubhub.com':
        tmp = new RegExp(/"Product",\|"name":"([^"]+)".*/.source
                      + /Total charge\s+([$\d.]+.*)/.source
                      + /Payment Method\s+([^-]+) - (\d+)/.source).exec(email_data);
        merchant = 'GrubHub|' + tmp[1]
        amount = tmp[2]
        payment_type = tmp[3] + ' x' + tmp[4]
        break;

      case '@lyftmail.com':
        tmp = /Charges to ([^*]+)\s\*(\d+)[^|]+\|([^|]+)/.exec(email_data);
        payment_type = tmp[1] + ' x' + tmp[2];
        amount = tmp[3];
        merchant = 'Lyft';
        break;

      case '@steampowered.com':
        tmp = new RegExp(/Payment method:[^|]+\|([^|]+)\|.*?/.source
                      + /Total:[^|]+\|([^\s|\|]+)/.source).exec(email_data);
        payment_type = tmp[1];
        amount = tmp[2];
        merchant = 'Steam';
        break;

      case '@updates.ubisoft.com':
        tmp = /Total :\|([\d.]+).*?\|Payment method\|([^|]+)/.exec(email_data);
        amount = '$' + tmp[1];
        payment_type = tmp[2];
        merchant = 'Ubisoft';
        break;
    }
  } catch (err) {
    date += '*'
    amount += '*'
    merchant += '*'
    payment_type += '*'
    use_gemini = true;
  }

  //Logger.log(`1: use_AI: ${use_gemini}, Date: ${date}, Amount: ${amount}, Merchant: ${merchant}, Payment: ${payment_type}`);

  if(use_gemini || date == "" || amount == "" || merchant == "" || payment_type == "")
  {
    const geminiResponse = callGemini(geminiPrompt);
    if(geminiResponse != null)
    {
      //Logger.log(`Gemini: ${geminiResponse}`);

      if (geminiResponse.indexOf("**Merchant:**") >= 0) {
        // **Merchant:** Uber
        // **Date:** Jun 14 2025
        // **Payment Method:** Discover
        // **Amount:** $44.92

        merchant = extractKey(merchant, geminiResponse, "**Merchant:**");
        date = extractKey(date, geminiResponse, "**Date:**");
        payment_type = extractKey(payment_type, geminiResponse, "**Payment Method:**");
        amount = extractKey(amount, geminiResponse, "**Amount:**");

      } else if(geminiResponse.indexOf("```json") >= 0) {
        // ```json
        // {
        //   "Merchant": "The Guardian Bookshop",
        //   "Date": "Jun 18 2025",
        //   "Payment Method": "Credit Card",
        //   "Amount": "$34.70"
        // }
        // ```

        var pos = geminiResponse.indexOf("```json") + "```json".length;
        var end = geminiResponse.length - 3;
      
        var text = geminiResponse.substring(pos, end).trim();

        var json = JSON.parse(text);
        if (json['Merchant']) merchant = json['Merchant'];
        if (json['Date']) date = json['Date'];
        if (json['Payment Method']) payment_type = json['Payment Method'];
        if (json['Amount']) amount = json['Amount'];
      }
    }
  }

  //Logger.log(`2: Date: ${date}, Amount: ${amount}, Merchant: ${merchant}, Payment: ${payment_type}`);

  return [date, amount, merchant, payment_type];
}
