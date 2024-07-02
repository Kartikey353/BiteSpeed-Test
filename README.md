
---

# API Usage Documentation

This document provides instructions on how to use the provided API endpoint to inspect data. The endpoint is a `POST` request that accepts an `emailId` (string) and `phoneNumber` (number) in the request body.

## API Endpoint

- **URL**: `https://bitespeed-test-84in.onrender.com/tst/inspect`
- **Method**: POST

## Request Format

### Request Body

The API expects the following parameters in the request body:

- `emailId` (string): The email address of the user.
- `phoneNumber` (number): The phone number of the user.

The body should be sent in JSON format.

### Example Request Body

```json
{
  "emailId": "kartikeybhardwaj353@gmail.com",
  "phoneNumber": 751889
}
```

## Example Code

Below is an example of how to make a POST request to the API using the `axios` library in JavaScript.

### Prerequisites

- Ensure you have Node.js installed.
- Install the `axios` library by running the following command in your project directory:

```bash
npm install axios
```

### Example Code

```javascript
const axios = require('axios');

// Create JSON data for the request body
let data = JSON.stringify({
  "emailId": "kartikeybhardwaj353@gmail.com",
  "phoneNumber": 751889
});

// Configure the request
let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://bitespeed-test-84in.onrender.com/tst/inspect',
  headers: { 
    'Content-Type': 'application/json'
  },
  data: data
};

// Make the request and handle the response
axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data)); // Print the response data
})
.catch((error) => {
  console.error(error); // Print any error that occurs
});
```
