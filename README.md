# BODSJS

 Javascript API Wrapper for the Bus Open Data Service

## Getting Started

Step 1: Grab an API Key from the BODS Website - <https://data.bus-data.dft.gov.uk/><br>
Step 2: Install BODSJS - `npm i bodsjs`<br>

## Fetching Live Bus Data

### Example Usage

```javascript
// Example: Fetch the location of all Arriva Northumbria (ANUM) buses running on the No. 1 line
let { BODSClient } = require("bodsjs");
let apikey = "ABCDEFGHIJKLM123456789"; 
let bods = new BODSClient(apikey); 

// Send the request - Returns a promise
let request = bods.fetchBusLocationDatafeed({
 operatorRef: "ANUM",
 lineRef: "1"
});

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

### Documentation

- [BODSClient Class](https://thatadamm.github.io/bodsjs/BODSClient.html)
- [`fetchBusLocationDatafeed()` options](https://thatadamm.github.io/bodsjs/global.html#BusLocationDatafeedOptions)

**Note:** The Bus Open Data Service updates bus location data every 10 seconds. Some services may take longer to send updates.

## Fetching timetable data

To use the timetable data, you must first install the dataset. This can be done programantically, or as a CLI.

Installing the dataset is not required if you do not need to use timetable data. It is saved into the `.bods-data` directory in your project's execution directory.

The total size depends on the amount of data required, but could exceed 1GB for the national dataset, where smaller regions only require ~500MB.

### CLI Usage

Run the database build script like so:<br>
`node node_modules/bodsjs/databaseBuilder.js --england`

You can replace `--england` with a different region to fetch its timetables. See the region table below for a list of options.

### API Usage

Use the static method `BODSClient.downloadTimetableData(suffix)`:

```javascript
const { BODSClient, TimetablesManager } = require("bodsjs");
async main() {
    await BODSClient.downloadTimetableData("england");

    // Use your TimetablesManager after the data is downloaded.

    // [...]
}
main();
```

**Note:** You should only request from the BODS server at most once every 24 hours.

### Available Regions

For CLI Usage, add `--<suffix>` as a CLI argument. E.G `--ea` or `--london`.<br>
For API Usage, simple pass a suffix as a string.

| Suffix  | Region  |
|---------|---------|
|`all`|National Data|
|`england`|England|
|`scotland`|Scotland|
|`wales`|Wales|
|`london`|London|
|`ea`|East Anglia|
|`em`|East Midlands|
|`ne`|North East|
|`nw`|North West|
|`se`|South East|
|`sw`|South West|
|`wm`|West Midlands|
|`yorkshire`|Yorkshire|

### Example usage

The `TimetablesManager` class helps to interface with a `sequelize` SQL query. Either:

- Use the provided helper methods
- Create custom queries with direct access to sequelize models

```javascript
// Prerequisite: Have the dataset installed at /.bods-data/ 
const {TimetablesManager} = require("bodsjs");

let manager = new TimetablesManager(); // Create manager. Prepares for db.

// Using the helper functions:
let routes = manager.getRoutesByName('X17');
let stop = manager.getStopById('075071006A');

// Or make your own queries with the database:
let trips = await manager.Trips.findAll({
    where: {
        trip_headsign: "Newcastle upon Tyne" // All trips where the bus displays "Newcastle upon Tyne"
    }
});

const { Op } = require("sequelize"); // Use operators
let stops = await manager.Trips.findAll({
    where: {
        [Op.like]: {stop_name: "Station"} // All stop_names that contain "Station"
    }
});

```

### Documentation

- [Helper Methods in TimetablesManager Class](https://thatadamm.github.io/bodsjs/TimetablesManager.html)
- [Database Objects](https://thatadamm.github.io/bodsjs/global.html)

## Current feature implementation

|                       | Full Support | Part Support | No Support Yet |
|-----------------------|--------------|--------------|----------------|
| Timetable Dataset API | ✅           |              |                |
| Bus Location Data     | ✅            |              |                |
| Fares Dataset API     |              |              | ✅              |

The Timetable Dataset API is supported, however the physical data in each dataset has not been implemented. The URL property is provided in the meantime.
This library is still in progress. More API support is in-the-works!

## Licensing

The data from the API contains public sector information licensed under the Open Government Licence v3.0.
Details of use can be found here: <https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/>

It should also be noted that I am not affiliated with the Bus Open Data Service.
The rest of the code provided by the library is licensed under the MIT license. See the LICENSE file for more info.
