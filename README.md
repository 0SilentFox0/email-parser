# Lead Email Processing and Sending Service

This Node.js service is responsible for processing incoming lead emails, extracting lead data, storing it in a MongoDB database, and sending confirmation emails using SMTP.

Prerequisites
Before running the project, make sure you have the following tools installed:

Node.js (v12 or later)
MongoDB (you can use MongoDB Atlas for cloud hosting)
A Gmail account for handling email sending and receiving (or configure for other services like Outlook, Yahoo, etc.).
Installation

## Step 1: Clone the repository

`git clone <repository_url>`

`cd <repository_directory>`

## Step 2: Install dependencies

`npm install`
This will install the required packages such as ts-node, imap-simple, nodemailer, mongoose, etc.

## Step 3: Create an .env file

Create an .env file at the root of your project and include the following variables:

## MongoDB connection string (replace with your actual MongoDB URI)

`MONGODB_URI=<your_mongodb_uri>`

## Email account credentials for IMAP and SMTP

`EMAIL_USER=<your_email>`
`EMAIL_PASS=<your_password>`

### Use app-specific password for Gmail if necessary

## SMTP configurations (for sending emails)

`SMTP_HOST="smtp.gmail.com"`
`SMTP_PORT="587"`

## IMAP configurations (for receiving emails)

`EMAIL_HOST="smtp.gmail.com"`
`EMAIL_PORT="993"`

## File path for attachments (PDFs)

`PDF_PATH=../resources/file.pdf`

### Note: Ensure to use environment variables for sensitive data such as your MONGODB_URI, EMAIL_USER, and EMAIL_PASS. Do not hardcode this information into your codebase.

## Step 4: Configure IMAP and SMTP settings

By default, the system is configured to use Gmail for sending and receiving emails. If you want to use other email services like Outlook or Yahoo, adjust the environment variables accordingly in .env.

## Step 5: Run MongoDB

Ensure that your MongoDB instance is running. You can either run it locally or use MongoDB Atlas by providing the appropriate connection string in the .env file.

Project Structure:

`src/email-processing-script.ts`:

Fetches emails via IMAP, extracts lead data, and stores it in MongoDB.

`src/lead-email-sender-script.ts`:

Sends email responses to leads using SMTP.

`src/test-email-connection.ts`:

A script to test the email connection for both IMAP and SMTP.

`src/services/email-sender-service.ts`:

Handles the SMTP email sending.

`src/services/email-processor-service.ts`:

Handles IMAP email fetching and processing.

`src/api/lead-model.ts`:

Defines the MongoDB model schema for storing leads.
Scripts
The following npm scripts are available to run various tasks:

## Start the Email Processing Service

`npm run start`

This will start the email processing service, which fetches unread emails, extracts lead data, and stores them in MongoDB.

## Send Emails

`npm run send-email`

This script sends confirmation emails to leads. It uses the email sender service to send emails via SMTP.

## Test Email Connection

`npm run test-email-connection`

This script tests your connection to both IMAP (for reading emails) and SMTP (for sending emails).

## How It Works

Email Processing:

The email processing script connects to the IMAP server (configured in the .env file) to fetch unread emails.
It extracts key information from the email content (such as name, address, position, etc.).
The extracted information is saved to a MongoDB collection.
Email Sending:

The email sender script sends follow-up emails using SMTP.
You can customize the email content and recipient address.
Error Handling:

If any issues occur (such as failed email fetching or sending), they are logged to the console.
The system will retry connecting to the email server in case of failure.
Environment Variables
Here’s a description of the key environment variables:

### Variable Description

| Variables   |                                 Description                                  |
| ----------- | :--------------------------------------------------------------------------: |
| MONGODB_URI |      MongoDB connection string, used to connect to your lead database.       |
| EMAIL_USER  | Email address used to log in to your email provider (for both IMAP and SMTP) |
| EMAIL_PASS  |          Password or app-specific password for your email account.           |
| SMTP_HOST   |    SMTP server host for sending emails (e.g., smtp.gmail.com for Gmail).     |
| SMTP_PORT   |                 SMTP server port (typically 587 for Gmail).                  |
| EMAIL_HOST  |        IMAP server host for receiving emails (e.g., imap.gmail.com).         |
| EMAIL_PORT  |                 IMAP server port (typically 993 for Gmail).                  |
| PDF_PATH    |             Path to the PDF file to attach when sending emails.              |

## Testing and Troubleshooting

Testing Email Sending:

Run the
`test-email-connection.ts`

script to ensure your SMTP configuration works.
Testing Email Fetching: Check your email inbox for unread emails and verify that they are processed and stored in MongoDB.
Checking MongoDB: Ensure that the leads are correctly stored by inspecting the MongoDB collection for any newly added entries.
Security Considerations
Email Credentials: Avoid hardcoding sensitive information (such as passwords) directly in your codebase. Use .env files to store such information.
App-Specific Passwords: If using Gmail, ensure you have generated an app-specific password for accessing the IMAP and SMTP services.
License
This project is licensed under the MIT License.
