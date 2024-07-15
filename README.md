# BODSJS
 Javascript API Wrapper for the Bus Open Data Service

## Getting Started
Step 1: Grab an API Key from the BODS Website - https://data.bus-data.dft.gov.uk/
Step 2: Install BODSJS - `npm i bodsjs`
Step 3: Create an instance of the BODSClient class:
```js
let { BODSClient } = require("bodsjs")
let bods = new BODSClient(apikey)
```
Step 4: Interact with the API using the client

## Example Usage
```js
// Example: Fetch the location of all Arriva Northumbria (ANUM) buses running on the No. 1 line
let { BODSClient } = require("bodsjs")
let apikey = "ABCDEFGHIJKLM123456789"
let bods = new BODSClient(apikey)

// Send the request - Returns a promise
let request = bods.fetchBusLocationDatafeed({
 operatorRef: "ANUM",
 lineRef: "1"
})

// Get the results of the request
request.then((result) => {
 // The request succeeded! Huzzah!
 let busPos = [result.latitude, result.longitude];
 // Do something with the data

}).catch((error) => {
 // The request failed - Log the error :(
 console.error(error)
});
```

# Current feature implementation
|                       | Full Support | Part Support | No Support Yet |
|-----------------------|--------------|--------------|----------------|
| Timetable Dataset API |              | ✅            |                |
| Bus Location Data     | ✅            |              |                |
| Fares Dataset API     |              |              | ✅              |

The Timetable Dataset API is supported, however the physical data in each dataset has not been implemented. The URL property is provided in the meantime.
This library is still in progress. More API support is in-the-works!

# Licensing
The data from the API contains public sector information licensed under the Open Government Licence v3.0.
Details of use can be found here: https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
