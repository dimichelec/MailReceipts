# MailReceipts
This is a Google Apps Script (JavaScript) creating a Gmail add-on letting me log the details of my receipts
to a spreadsheet then labeling the email and trashing it, cleaning-up my inbox.

This is a rewrite from my Python [mail_receipts](https://github.com/dimichelec/mail_receipts) project essentially
performing the same function, yet not as efficiently as having the Gmail add-on right on the Gmail UI.

I've written this as a follow-on from the Apps Script sample [Expense It!](https://codelabs.developers.google.com/codelabs/gmail-add-ons#0).

Since v0.91 MailReceipts uses Gemini to scan a receipt if it wasn't fully decoded as one of the canned regex-style parsers.

# Acknowledgements
written by [Carmen DiMichele](https://dimichelec.wixsite.com/carmendimichele) 
