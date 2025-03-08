// Import libraries
let xml2js = require("xml2js");
let path = require("path");
let { Op } = require("sequelize");
// Typedefs made with this documentation: https://data.bus-data.dft.gov.uk/guidance/requirements/?section=apireference

// Request Docs are as follows:

/**
 * @typedef {Object} TimetableDatasetOptions 
 * @prop {Number} [adminArea] - adminArea is a field within the data, and therefore if any of the TransXChange files within a specific data set has the specified adminArea the whole data set will be returned. A list of adminAreas can be found on the NPTG website: https://data.gov.uk/dataset/3b1766bf-04a3-44f5-bea9-5c74cf002e1d/national-public-transport-gazetteer-nptg
 * @prop {Date|String} [endDateStart] - Limit results to data sets with services with end dates after this date. String formatted as YYYY-MM-DDTHH:MM:SS. 
 * @prop {Date|String} [endDateEnd] - Limit results to data sets with services with end dates before this date. String formatted as YYYY-MM-DDTHH:MM:SS. 
 * @prop {Number} [limit] - The maximum number of records to return. 
 * @prop {Date|String} [modifiedDate] - Limit results to data sets that have been created/updated since the specified date. String formatted as YYYY-MM-DDTHH:MM:SS. 
 * @prop {String[]|String} [noc] - Input a comma separated list of (or array of strings including) National Operator Codes to limit results to data sets of the publishers associated to the specified National Operator Code. A publisher may have multiple National Operator Codes associated with it. Your response will include data for all National Operator Codes associated with that publisher. Not just those included in the query parameter. National Operator codes can be found on the Traveline website, https://www.travelinedata.org.uk/traveline-open-data/transport-operations/about-2/
 * @prop {Number} [offset] - Return results that match the query starting from the specified offset. e.g. &offset=10&limit=25 returns results from 11 to 35. The default is set to 0. 
 * @prop {String} [search] - Return data sets where the data set name, data set description, organisation name, or admin area name contain the specified value. 
 * @prop {('published'|'inactive')} [status] - Limit results to data sets with the specified status String, accepted values are published, inactive. 
 * @prop {Date|String} [startDateStart] - Limit results to data sets with services with start dates after this date. String formatted as YYYY-MM-DDTHH:MM:SS. 
 * @prop {Date|String} [startDateEnd] - Limit results to data sets with services with start dates before this date. String formatted as YYYY-MM-DDTHH:MM:SS. 
 * @prop {String} [datasetID] - Limit results to a specific data set of a publisher using the data set ID. 
 * @prop {('red'|'amber'|'green')} [dqRag] - Data rating. Limit results to data sets with the specified String value, accepted values are red, amber, green. 
 * @prop {Boolean} [bodsCompliance] - Is BODS compliant. Limit results to data sets with the specified boolean value. 
 */

/**
 * @typedef {Object} BoundingBox - A bounding box to be used in the boundingBox API call parameter
 * @prop {Number} minLat - Smallest latitude in the selection
 * @prop {Number} maxLat - Largest latitude in the selection
 * @prop {Number} minLng - Smallest longitude in the selection
 * @prop {Number} maxLng - Largest longitude in the selection
 */

/**
 * @typedef {Object} FaresDatasetOptions
 * @prop {String} [noc] - Input a comma separated list of National Operator Codes to limit results to data sets of the publishers associated to the specified National Operator Code. A publisher may have multiple National Operator Codes associated with it. Your response will include data for all National Operator Codes associated with that publisher. Not just those included in the query parameter. National Operator codes can be found on the Traveline website, https://www.travelinedata.org.uk/traveline-open-data/transport-operations/about-2/
 * @prop {('published'|'inactive')} [status] - Limit results to data sets with the specified status String, accepted values are published, inactive. 
 * @prop {BoundingBox} [boundingBox] - Limit results to fares data sets that contain information for the area within the rectangular boundingBox you set using `require("bodsjs").createBoundingBox()`.
 * @prop {Number} [limit] - The maximum number of records to return. 
 * @prop {Number} [offset] - Return results that match the query starting from the specified offset. e.g. &offset=10&limit=25 returns results from 11 to 35. The default is set to 0. 
 */

/**
 * @typedef {Object} BusLocationDatafeedOptions
 * @prop {BoundingBox} [boundingBox] - Limit results to fares data sets that contain information for the area within the rectangular boundingBox you set using `require("bodsjs").createBoundingBox()`.
 * @prop {String} [operatorRef] - Limit results to data feeds with the operatorRef. The National Operator Code is often used by publishers as the input for operatorRef, which can be found on the Traveline website, https://www.travelinedata.org.uk/traveline-open-data/transport-operations/about-2/
 * @prop {String} [lineRef] - Limit results to bus location data with the specified Line Ref. 
 * @prop {String} [producerRef] - Limit results to bus location data with the specified Producer Ref. 
 * @prop {String} [originRef] - Limit results to bus location data with the specified Origin Ref. Inputs for Origin Ref are normally National Public Transport Access Nodes (NaPTAN), which can be found on the following website: https://data.gov.uk/dataset/ff93ffc1-6656-47d8-9155-85ea0b8f2251/national-public-transport-access-nodes-naptan
 * @prop {String} [destinationRef] - Limit results to bus location data with the specified Destination Ref. Inputs for Destination Ref are normally National Public Transport Access Nodes (NaPTAN), which can be found on the following website: https://data.gov.uk/dataset/ff93ffc1-6656-47d8-9155-85ea0b8f2251/national-public-transport-access-nodes-naptan
 * @prop {String} [vehicleRef] - Limit results to bus location data with the specified vehicleRef. The vehicleRef is a unique reference for the vehicle that is consistent and is generated by the vehicle equipment. 
 */

// Now, for response docs:

// TIMETABLES
/**
 * @typedef {Object} AdminAreaObject Contains ATCO Codes and Admin Area names
 * @prop {String} atco_code The ATCO code for the area - See https://mullinscr.github.io/naptan/atco_codes/#lookup-table
 * @prop {String} name The name of the area
 */

/**
 * @typedef {Object} LocalityObject
 * @prop {String} gazetteer_id The National Public Transport Gazeteer (NPTG) ID that relates to the locality
 * @prop {String} name The locality name
 */

/**
 * @typedef {Object} TimetableDatasetResponseResult
 * @prop {Number} id The timetable entry ID
 * @prop {String} created The time the timetable entry was created
 * @prop {String} modified The last time the timetable entry was updated/edited
 * @prop {String} operatorName The name of the bus company who operates the lines in this entry
 * @prop {String[]} noc An array containing the National Operator Codes linked to this entry
 * @prop {String} name The name of this timetable dataset entry
 * @prop {String} description The description of this timetable dataset entry
 * @prop {String} comment Additional comment to this dataset
 * @prop {('inactive'|'published')} status The status of this dataset entry - published or inactive
 * @prop {String} url The URL to download this dataset entry
 * @prop {String} extension The file type/extension of the file located at the URL (see url property)
 * @prop {String[]} lines An array containing a list of line numbers/names this affects
 * @prop {String} firstStartDate
 * @prop {String} lastStartDate
 * @prop {String} lastEndDate
 * @prop {AdminAreaObject} adminAreas Array containing objects with ATCO Codes and area names. Often relates to a region of the UK
 * @prop {LocalityObject} locaities Array containing objects with NPTG IDs and their names. Often relates to a local area.
 * @prop {String} dqScore How compliant the data is with the BODS standard. Given as a number and % sign
 * @prop {('red'|'amber'|'green')} dqRag The rating based upon the BODS data standard score. Either "red", "amber" or "green"
 * @prop {Boolean} bodsCompliance Whether the dataset is compliant with the BODS standards. Using data that isn't is not recommended
 */

// Will omit next and previous from the below results, as they will be used in a new function anyway :)
/**
 * @typedef {Object} TimetableDatasetResponse
 * @prop {Number} count The number of entries found
 * @prop {TimetableDatasetResponseResult[]} results Array of the found entries
 */

// BUS LOCATIONS

/**
 * @typedef {Object} BusLocationDataset Data containing location and other data for a bus
 * @prop {String} RecordedAtTime String containing date/time when the data was last recorded
 * @prop {String} ItemIdentifier String containing UUID that identifies this data
 * @prop {String} ValidUntilTime String containing date/time of when this data expires
 * @prop {Object} MonitoredVehicleJourney Contains information about the ongoing bus journey
 * @prop {String} MonitoredVehicleJourney.LineRef String containing the line number this bus is operating on
 * @prop {String} MonitoredVehicleJourney.DirectionRef The direction the bus is going. Usually "outbound" or "inbound"
 * @prop {Object} MonitoredVehicleJourney.FramedVehicleJourneyRef Contains date information for this journey
 * @prop {String} MonitoredVehicleJourney.FramedVehicleJourneyRef.DataFrameRef
 * @prop {String} MonitoredVehicleJourney.FramedVehicleJourneyRef.DatedVehicleJourneyRef
 * @prop {String} MonitoredVehicleJourney.PublishedLineName The published name of the line the bus is operating on
 * @prop {String} MonitoredVehicleJourney.OperatorRef The operator running this bus journey
 * @prop {String} MonitoredVehicleJourney.OriginRef The NAPTAN code for the stop/stand this journey started at
 * @prop {String} MonitoredVehicleJourney.OriginName The name of the stop that this journey started at. May not include the full stop name!
 * @prop {String} MonitoredVehicleJourney.DestinationRef The NAPTAN code for the stop/stand this journey will terminate at
 * @prop {String} MonitoredVehicleJourney.DestinationName The name of the stop that this journey will terminate at. May not include the full stop name!
 * @prop {String} MonitoredVehicleJourney.OriginAimedDepartureTime String containing date/time when the bus was due to leave its origin
 * @prop {String} MonitoredVehicleJourney.DestinationAimedArrivalTime String containing date/time when the bus was due to arrive at its destination
 * @prop {Object} MonitoredVehicleJourney.VehicleLocation Object containing latitude and longitude of the buses
 * @prop {String} MonitoredVehicleJourney.VehicleLocation.Longitude String containing number of the current longitude of the bus
 * @prop {String} MonitoredVehicleJourney.VehicleLocation.Latitude String containing number of the current latitude of the bus
 * @prop {String} MonitoredVehicleJourney.Bearing The current bearing/direction of the bus.
 * @prop {String} MonitoredVehicleJourney.BlockRef
 * @prop {String} MonitoredVehicleJourney.VehicleRef The number of the vehicle
 * @prop {Object} Extensions Additional information about this bus
 */

/**
 * Provides the base client infrastructure for using the Bus Open Data Service.
 */
class BODSClient {
    #apikey = null;
    /**
     * Creates a new Bus Open Data Service client. 
     * @argument {String} apikey Provide an API Key to identify your use of the API - Get one by signing in/up @ https://data.bus-data.dft.gov.uk/account/login/
     */
    constructor(apikey) {
        if (!apikey) throw new Error("No API Key provided when creating a new BODSClient - Get one by signing in/up at https://data.bus-data.dft.gov.uk/account/login/")
        this.#apikey = apikey;
    }

    /**
     * @deprecated ⚠️ Data fetched is in an unconverted format - Try the new TimetablesManager class instead.
     * Performs a timetable dataset query based on the options provided.
     * @param {TimetableDatasetOptions} opts Options for the Timetable dataset query
     * @returns {Promise<TimetableDatasetResponse>} The query's results.
     */
    fetchTimetableDataset(opts) {
        // Options are added to this string when they are used.
        let queryString = `?api_key=${this.#apikey}`
        if (opts) {
            // startDateEnd
            if (opts.startDateEnd) {
                // Determine the type, and add its relevant string on
                if (typeof opts.startDateEnd == "string") {
                    queryString += "&startDateEnd=" + opts.startDateEnd
                } else if (opts.startDateEnd instanceof Date) {
                    queryString += "&startDateEnd=" + opts.startDateEnd.toISOString().substring(0, 19)
                } else {
                    // TypeError - You didn't provide a string or `new Date()` in the startDateEnd parameter! :O
                    throw new TypeError("Invalid startDateEnd parameter type - Expected either String or Date Object")
                }
            } else if (opts.startDateStart) {
                // Determine the type, and add its relevant string on
                if (typeof opts.startDateStart == "string") {
                    queryString += "&startDateStart=" + opts.startDateStart
                } else if (opts.startDateStart instanceof Date) {
                    queryString += "&startDateStart=" + opts.startDateStart.toISOString().substring(0, 19)
                } else {
                    // TypeError - You didn't provide a string or `new Date()` in the startDateStart parameter! :O
                    throw new TypeError("Invalid startDateStart parameter type - Expected either String or Date Object")
                }
            } else if (opts.endDateStart) {
                // Determine the type, and add its relevant string on
                if (typeof opts.endDateStart == "string") {
                    queryString += "&endDateStart=" + opts.endDateStart
                } else if (opts.endDateStart instanceof Date) {
                    queryString += "&endDateStart=" + opts.endDateStart.toISOString().substring(0, 19)
                } else {
                    // TypeError - You didn't provide a string or `new Date()` in the endDateStart parameter! :O
                    throw new TypeError("Invalid endDateStart parameter type - Expected either String or Date Object")
                }
            } else if (opts.endDateEnd) {
                // Determine the type, and add its relevant string on
                if (typeof opts.endDateEnd == "string") {
                    queryString += "&endDateEnd=" + opts.endDateEnd
                } else if (opts.endDateEnd instanceof Date) {
                    queryString += "&endDateEnd=" + opts.endDateEnd.toISOString().substring(0, 19)
                } else {
                    // TypeError - You didn't provide a string or `new Date()` in the endDateEnd parameter! :O
                    throw new TypeError("Invalid endDateEnd parameter type - Expected either String or Date Object")
                }
            } else if (opts.modifiedDate) {
                // Determine the type, and add its relevant string on
                if (typeof opts.modifiedDate == "string") {
                    queryString += "&modifiedDate=" + opts.modifiedDate
                } else if (opts.modifiedDate instanceof Date) {
                    queryString += "&modifiedDate=" + opts.modifiedDate.toISOString().substring(0, 19)
                } else {
                    // TypeError - You didn't provide a string or `new Date()` in the modifiedDate parameter! :O
                    throw new TypeError("Invalid modifiedDate parameter type - Expected either String or Date Object")
                }
            } else if (opts.adminArea) {
                queryString += "&adminArea=" + opts.adminArea
            } else if (opts.bodsCompliance) {
                if (typeof opts.bodsCompliance == Boolean) {
                    queryString += "&bodsCompliance=" + opts.bodsCompliance.toString()
                } else {
                    throw new TypeError("Invalid bodsCompliance parameter type - Expected Boolean, got " + typeof opts.bodsCompliance)
                }
            } else if (opts.datasetID) {
                queryString += "&datasetID=" + opts.datasetID
            } else if (opts.dqRag) {
                queryString += "&dqRag=" + opts.dqRag
            } else if (opts.limit) {
                queryString += "&limit=" + opts.limit
            } else if (opts.noc) {
                if (typeof opts.noc == "string") {
                    queryString += "&noc=" + opts.noc
                } else if (opts.noc instanceof Array) {
                    queryString += "&noc=" + opts.noc.join(",")
                } else {
                    throw new TypeError("Incorrect value for noc parameter - Expected either a string or Array of strings, but got " + typeof opts.noc)
                }
            } else if (opts.offset) {
                queryString += "&offset=" + opts.offset
            } else if (opts.search) {
                queryString += "&search=" + opts.search
            } else if (opts.status) {
                queryString += "&status=" + opts.status
            }
        }

        // Now, begin the query
        return new Promise((resolve, reject) => {
            fetch("https://data.bus-data.dft.gov.uk/api/v1/dataset" + queryString)
                .then((res) => {
                    // If status is all good, get main response body, and return it.
                    if (res.status == 200) {
                        res.json().then((result) => {
                            resolve(result)
                        })
                        // If status has returned a 404 (when datasetID is not found), return an empty response object for consistency
                    } else if (res.status == 404) {
                        resolve({
                            count: 0,
                            next: null,
                            previous: null,
                            results: []
                        })
                        // Otherwise, it's all gone horribly wrong. Reject and send an error
                    } else {
                        res.text().then((result) => {
                            reject("Failed to fetch dataset from BODS API - " + result)
                        })
                    }
                })
                .catch(() => {
                    reject("Error while connecting to API - Check your connection?")
                })
        })
    }

    /**
     * @deprecated ⚠️ Data fetched is in an unconverted format - Try the new TimetablesManager class instead.
     * Fetches the next or previous page from the URL 
     * @param {String} url The URL provided in the `next` or `previous` attributes of a timetable dataset API call
     */
    fetchTimetablePage(url) {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then((res) => {
                    if (res.status == 200) {
                        res.json().then((result) => resolve(result))
                    } else {
                        reject("Request failed with status code " + res.status + ". " + res.statusText)
                    }
                })
                .catch(() => {
                    reject("Error while connecting to API - Check your connection?")
                })

        })
    }

    /**
     * Fetches the Bus Location datafeed and converts results to JSON
     * @param {BusLocationDatafeedOptions} opts 
     * @returns {BusLocationDataset[]} Array of buses and their related information
     */
    fetchBusLocationDatafeed(opts) {
        let queryString = "?api_key=" + this.#apikey
        if (opts) {
            if (opts.boundingBox) {
                let b = opts.boundingBox;
                queryString += `&boundingBox=${b.minLng},${b.minLat},${b.maxLng},${b.maxLat}`
            } else if (opts.destinationRef) {
                queryString += `&destinationRef=${opts.destinationRef}`
            } else if (opts.lineRef) {
                queryString += `&lineRef=${opts.lineRef}`
            } else if (opts.operatorRef) {
                queryString += `&operatorRef=${opts.operatorRef}`
            } else if (opts.originRef) {
                queryString += `&originRef=${opts.originRef}`
            } else if (opts.producerRef) {
                queryString += `&producerRef=${opts.producerRef}`
            } else if (opts.vehicleRef) {
                queryString += `&vehicleRef=${opts.vehicleRef}`
            }
        }
        // Fetch it with the data
        return new Promise((resolve, reject) => {
            fetch("https://data.bus-data.dft.gov.uk/api/v1/datafeed" + queryString)
                .then((res) => {
                    if (res.status == 200) {
                        res.text().then(async (resultXml) => {
                            var parser = new xml2js.Parser({ trim: true, explicitArray: false });
                            let result = await parser.parseStringPromise(resultXml)
                            resolve(result)
                        })
                    }
                })
                .catch(() => {
                    reject("Error while connecting to API - Check your connection?")
                })
        })

    }

    /**
     * Downloads data for a specific region into `/.bods-data/`. Should be done no more than every 24 hours. 
     * For use with the `TimetablesManager` class - See more info on Github.
     * @param {('all'|'ea'|'em'|'england'|'london'|'ne'|'nw'|'scotland'|'sw'|'se'|'wales'|'wm'|'yorkshire')} region The region to fetch. 
     * @returns {Promise} A promise. TimetableManager instances should only 
     */
    static async downloadTimetableData(region) {
        await require("./databaseBuilder.js")(region); // Code in gtfsToJSON.js
        this.region = region;
        return;
    }
}

/**
 * Creates a bounding box to be used in API Calls
 * @param {Number} minLat - Smallest latitude to use
 * @param {Number} maxLat - Largest latitude to use
 * @param {Number} minLng - Smallest longitude to use
 * @param {Number} maxLng - Largest longitude to use
 * @returns {BoundingBox|undefined} - A BoundingBox Object to use in the boundingBox parameters of API Calls, or undefined if not all parameters are given.
 */
function createBoundingBox(minLat, maxLat, minLng, maxLng) {
    if (minLat && maxLat && minLng && maxLng) {
        return {
            minLat: Number(minLat),
            maxLat: Number(maxLat),
            minLng: Number(minLng),
            maxLng: Number(maxLng)
        }
    } else {
        return undefined;
    }
}

/**
 * @typedef {Object} Agency An object containing information on an agency
 * @prop {String} agency_id The ID of the agency
 * @prop {String} agency_name The name of the agency
 * @prop {String} agency_url The related URL. Many (if not all) of these link to traveline.
 * @prop {String} agency_timezone Timezone data, in the IANA TZDB format.
 * @prop {String} agency_lang ISO 639-1 code for the agency's main language
 * @prop {String} agency_phone Phone number for the agency
 * @prop {String} agency_noc National Operator Code for this agency
 */

/**
 * @typedef {Object} Route An object containing information about a bus route
 * @prop {Number} route_id The ID of this route
 * @prop {String} agency_id The ID of the agency operating this route
 * @prop {String} route_short_name The shortened name of this route (E.G `X17`)
 * @prop {String} route_long_name The longer name of this route (often not provided).
 * @prop {Number} route_type An integer determining the type of route.
 */

/**
 * @typedef {ShapePoint[]} Shape An array of individual shape points
 */

/**
 * @typedef {Object} ShapePoint An object containing information about a bus route shape. This is not the whole shape, but a single point along it.
 * @prop {Number} id A unique ID for this entry
 * @prop {String} shape_id The ID of the shape this entry belongs to
 * @prop {Number} shape_pt_lat The latitude of this point
 * @prop {Number} shape_pt_lon The longitude of this point
 * @prop {Number} shape_pt_sequence Where in the sequence of all ShapePoints this point comes (zero-indexed).
 * @prop {String} shape_dist_travelled The distance from the start of the shape (often not provided). 
 */

/**
 * @typedef {(0|1|2|3)} pickup_type 
 * 0 = Regularly scheduled pickup 
 * 1 = No pickup available
 * 2 = Must phone the agency to arrange pickup
 * 3 = Must communicate with driver to arrange pickup
 */

/**
 * @typedef {(0|1)} drop_off_type
 * 0 = Passengers can be dropped off here
 * 1 = Passengers cannot be dropped off here
 */

/**
 * @typedef {Object} StopTime An object containing information about a time when a bus stops along a trip
 * @prop {Number} id A unique ID for this entry
 * @prop {String} trip_id The ID of the trip that stops here
 * @prop {Date} arrival_time The time the bus is due to arrive at the stop
 * @prop {Date} departure_time The time the bus is due to leave the stop
 * @prop {String} stop_id The ID of the stop this bus uses on this trip
 * @prop {Number} stop_sequence Determines the order this stop comes on this trip (zero-indexed)
 * @prop {String} stop_headsign What the bus headsign should display at this stop
 * @prop {pickup_type} pickup_type If and how this stop boards passengers
 * @prop {drop_off_type} drop_off_type If passengers can alight at this stop
 * @prop {String} shape_dist_travelled The distance along the trip this stop can be found at (often not provided).
 * @prop {Boolean} timepoint If this stop is a timing point (bus will stop and wait if early)
 * @prop {String} stop_direction_name The direction buses go from this stop (often not provided).
 */

/**
 * @typedef {(null|0|1|2|3|4)} location_type 
 * 0 or null = A stop (or a platform, if part of a station)
 * 1 = A station (contains multiple stops)
 * 2 = Entrance/Exit (to a station)
 * 3 = Generic Node (on a path through/to a station)
 * 4 = Boarding Area (a specifc part of a station where people can board/alight vehicles)
 */

/**
 * @typedef {Object} Stop An object containing information about a stop
 * @prop {String} stop_id The BODS stop ID
 * @prop {String} stop_code The printed stop ID, often presented on signage for easier reading
 * @prop {String} stop_name The name of this stop.
 * @prop {Number} stop_lat The latitude of this stop
 * @prop {Number} stop_long The longitude of this stop
 * @prop {Boolean} wheelchair_boarding If this stop allows for wheelchair boarding (false may mean no data provided, which is often the case)
 * @prop {location_type} location_type The type of location this stop is
 * @prop {String} parent_station The BODS Stop ID of the station that contains this stop
 * @prop {String} platform_code The code for this platform (within a station) - E.G "A"
 */

/**
 * @typedef {(0|1|2)} wheelchair_accessible
 * 0 = No accessibility info
 * 1 = Can accomodate at least 1 wheelchair rider
 * 2 = Cannot accomodate any wheelchair riders
 */

/**
 * @typedef {Object} Trip An object containing information about a bus trip along a route
 * @prop {Number} route_id The ID of the route this bus is travelling along
 * @prop {Number} service_id The ID of the service that this bus is operating on (obsolete due to no calendar files provided)
 * @prop {String} trip_id The ID of this trip 
 * @prop {String} trip_headsign What the bus headsign should display for this trip (should be overrided by the StopTime stop_headsign property as it arrives at that stop)
 * @prop {Number} direction_id Direction of travel (0 = outbound, 1 = inbound)
 * @prop {String} block_id Specifies the block that this trip belongs to
 * @prop {String} shape_id The shape that corresponds to the trip
 * @prop {wheelchair_accessible} wheelchair_accessible Whether wheelchairs users can board on this trip
 * @prop {String} trip_direction_name The name of the direction the bus is going
 * @prop {String} vehicle_journey_code The code of this bus journey
 */

/**
 * Management class for easy reading of the database installed using `BODSClient.downloadtimetableData(region);`
 * @example ```javascript
 * const {TimetablesManager, BODSClient} = require("bodsjs");
 * await BODSClient.downloadTimetableData('england');
 * let timetables = new TimetablesManager();
 */
class TimetablesManager {
    #database;

    /**
     * Loads database, allowing for easy querying with supplied methods
     */
    constructor() {
        let { Sequelize, DataTypes } = require("sequelize");
        this.#database = new Sequelize({
            dialect: 'sqlite',
            storage: path.join(process.cwd(), "/.bods-data/database.sqlite"),
            logging: () => { }
        });
        // Create database tables
        /**
         * Agencies database access
         */
        this.Agencies = this.#database.define("Agency", {
            agency_id: {
                primaryKey: true,
                type: DataTypes.STRING
            },
            agency_name: DataTypes.STRING,
            agency_url: DataTypes.STRING,
            agency_timezone: DataTypes.STRING,
            agency_lang: DataTypes.STRING,
            agency_phone: DataTypes.STRING,
            agency_noc: DataTypes.STRING
        });

        this.Calendars = this.#database.define("Calendar", {
            service_id: {
                primaryKey: true,
                type: DataTypes.NUMBER
            },
            monday: DataTypes.NUMBER,
            tuesday: DataTypes.NUMBER,
            wednesday: DataTypes.NUMBER,
            thursday: DataTypes.NUMBER,
            friday: DataTypes.NUMBER,
            saturday: DataTypes.NUMBER,
            sunday: DataTypes.NUMBER,
            start_date: DataTypes.DATE,
            end_date: DataTypes.DATE
        });

        this.CalendarDates = this.#database.define("CalendarDate", {
            service_id: DataTypes.NUMBER,
            date: DataTypes.DATE,
            exception_type: DataTypes.NUMBER
        });
        
            // CalendarDates <=-> Calendars
            CalendarDates.belongsTo(Calendars, { foreignKey: "service_id", constraints: false });
            Calendars.hasMany(CalendarDates, { foreignKey: "service_id", constraints: false });

        /**
         * Routes database access
         */
        this.Routes = this.#database.define("Route", {
            route_id: {
                primaryKey: true,
                type: DataTypes.NUMBER
            },
            agency_id: DataTypes.STRING,
            route_short_name: DataTypes.STRING,
            route_long_name: DataTypes.STRING,
            route_type: DataTypes.NUMBER
        })

        // Routes <=-> Agencies
        this.Routes.belongsTo(this.Agencies, { foreignKey: "agency_id" });
        this.Agencies.hasMany(this.Routes, { foreignKey: "agency_id" });

        /**
         * Route Shapes database access
         */
        this.Shapes = this.#database.define("Shape", {
            shape_id: DataTypes.STRING,
            shape_pt_lat: DataTypes.NUMBER,
            shape_pt_lon: DataTypes.NUMBER,
            shape_pt_sequence: DataTypes.NUMBER,
            shape_dist_travelled: DataTypes.STRING // Unsure why - Should be able to convert to number fine.
        });

        /**
         * StopTimes database access
         */
        this.StopTimes = this.#database.define("StopTime", {
            trip_id: DataTypes.STRING,
            arrival_time: DataTypes.TIME,
            departure_time: DataTypes.TIME,
            stop_id: DataTypes.STRING,
            stop_sequence: DataTypes.NUMBER,
            stop_headsign: DataTypes.STRING,
            pickup_type: DataTypes.NUMBER,
            drop_off_type: DataTypes.NUMBER,
            shape_dist_travelled: DataTypes.STRING, // Keeping it consistent with Shape table
            timepoint: DataTypes.BOOLEAN,
            stop_direction_name: DataTypes.STRING
        });

        /**
         * Stops database access
         */
        this.Stops = this.#database.define("Stop", {
            stop_id: {
                primaryKey: true,
                type: DataTypes.STRING
            },
            stop_code: DataTypes.STRING,
            stop_name: DataTypes.STRING,
            stop_lat: DataTypes.NUMBER,
            stop_lon: DataTypes.NUMBER,
            wheelchair_boarding: DataTypes.BOOLEAN,
            location_type: DataTypes.NUMBER,
            parent_station: DataTypes.STRING,
            platform_code: DataTypes.STRING
        });
        this.StopTimes.belongsTo(this.Stops, {foreignKey: "stop_id"});
        this.Stops.hasMany(this.StopTimes, {foreignKey: "stop_id"});
        

        /**
         * Trips database access
         */
        this.Trips = this.#database.define("Trip", {
            route_id: DataTypes.NUMBER,
            service_id: DataTypes.NUMBER,
            trip_id: {
                primaryKey: true,
                type: DataTypes.STRING
            },
            trip_headsign: DataTypes.STRING,
            direction_id: DataTypes.NUMBER,
            block_id: DataTypes.STRING,
            shape_id: DataTypes.STRING,
            wheelchair_accessible: DataTypes.BOOLEAN,
            trip_direction_name: DataTypes.STRING,
            vehicle_journey_code: DataTypes.STRING
        });
        // Trips <=-> Routes
        this.Trips.belongsTo(this.Routes, {foreignKey: "route_id"});
        this.Routes.hasMany(this.Trips, {foreignKey: "route_id"});
        // Trips <-=> StopTimes
        this.StopTimes.belongsTo(this.Trips, {foreignKey: "trip_id"});
        this.Trips.hasMany(this.StopTimes, {foreignKey: "trip_id"});

        
        Trips.belongsTo(Calendars, { foreignKey: "service_id", constraints: false });
        Calendars.hasMany(Trips, { foreignKey: "service_id", constraints: false });
        this.region = null;
    }

    /**
     * Gets the agency by its ID 
     * @param {String} ID 
     * @returns {Promise<Agency>} The agency with this ID
     */
    async getAgencyById(ID) {
        return await this.Agencies.findOne({
            where: {
                agency_id: ID
            }
        });
    }

    /**
     * Searches for agencies with a name containing a substring
     * @param {String} substring The string to search for
     * @returns {Promise<Agency[]>} An array of found agencies
     */
    async getAgenciesByName(substring) {
        return await this.Agencies.findAll({
            where: {
                [Op.like]: { agency_name: substring }
            }
        });
    }

    /**
     * Gets an agency from its National Operator Code 
     * @param {String} noc The National Operator Code to search for
     * @returns {Promise<Agency>} The agency with this National Operator Code
     */
    async getAgencyByNOC(noc) {
        return await this.Agencies.findOne({
            where: {
                agency_noc: noc
            }
        });
    }

    /**
     * Finds a route from its route ID
     * @param {Number} id The ID to search for
     * @returns {Promise<Route>} The route with this ID
     */
    async getRouteById(id) {
        return await this.Routes.findOne({
            where: {
                route_id: id
            }
        })
    }

    /**
     * Gets routes by short name
     * @param {String} name Name of the route (E.G X17)
     * @returns {Promise<Route[]>} The routes that match this name
     */

    async getRoutesByName(name) {
        return await this.Routes.findAll({
            where: {
                route_short_name: name
            }
        })
    }

    /**
     * Gets a Shape (array of ShapePoints) by its ID
     * @param {String} id The ID of the whole shape 
     * @returns {Promise<Shape>}
     */
    async getShapeById(id) {
        return await this.Shapes.findAll({
            where: {
                shape_id: id
            }
        })
    }

    /**
     * Gets a list of StopTimes by their trip_id
     * @param {String} id The ID of the trip to look for
     * @returns {Promise<StopTime[]>} An array of different StopTimes
     */
    async getStopTimesByTrip(id) {
        return await this.StopTimes.findAll({
            where: {
                trip_id: id
            }
        })
    }

    /**
     * Gets a list of StopTimes by the stop the buses use
     * @param {String} id The ID of the stop to look for
     * @returns {Promise<StopTime[]>} An array of different StopTimes
     */
    async getStopTimesByStop(id) {
        return await this.StopTimes.findAll({
            where: {
                stop_id: id
            }
        })
    }

    /**
     * Gets a stop by its ID
     * @param {String} id The ID of the stop
     * @returns {Promise<Stop>} The Stop with this ID
     */
    async getStopById(id) {
        return await this.Stops.findOne({
            where: {
                stop_id: id
            }
        })
    }

    /**
     * Gets all stops by their parent station stop ID. 
     * This (probably) won't work for every station.
     * @param {String} parent ID of the parent stop
     * @returns {Promise<Stop[]>} The list of stops within the station
     */
    async getStopsByStation(parent) {
        return await this.Stops.findAll({
            where: {
                parent_station: parent
            }
        })
    }

    /**
     * Gets the stop by its code (often printed on signage at the stop)
     * @param {String} code The code to search for
     * @returns {Promise<Stop>} The stop with this code
     */
    async getStopByCode(code) {
        return await this.Stops.findOne({
            where: {
                stop_code: code
            }
        })
    }

    /**
     * Get all stops within an area using a Bounding Box
     * @param {BoundingBox} boundingBox A BoundingBox that specifies an area to look in
     * @returns {Promise<Stop[]>} A list of stops within the area
     */
    async getStopsByBounds(boundingBox) {
        return await this.Stops.findAll({
            where: {
                stop_lat: { // Thing < that < BigThing
                    [Op.lt]: boundingBox.maxLat,
                    [Op.gt]: boundingBox.minLat
                },
                stop_lon: {
                    [Op.lt]: boundingBox.maxLng,
                    [Op.gt]: boundingBox.minLng
                }
            }
        })
    }

    /**
     * Get a trip by its ID
     * @param {String} id The trip ID 
     * @returns {Promise<Trip>} The trip with this ID
     */
    async getTripById(id) {
        return await this.Trips.findOne({
            where: {
                trip_id: id
            }
        })
    };

    /**
     * Get a list of trips from their Route IDs
     * @param {Number} id The Route ID this trip runs on
     * @returns {Promise<Trip[]>} A list of trips 
     */
    async getTripsFromRouteID(id) {
        return await this.Trips.findAll({
            where: {
                route_id: id
            }
        })
    }

    /**
     * Get a Calendar entry from their Service IDs
     * @param {Number} id The service ID to look for
     * @returns {Promise<Calendar>}
     */
    async getCalendarEntryFromServiceID(id) {
        return await this.Calendars.findOne({
            where: {
                service_id: id
            }
        })
    }

    /**
     * Get a list of Calendar Date entries from their Service IDs
     * @param {Number} id The service ID to look for
     * @returns {Promise<Calendar[]>}
     */
    async getCalendarDatesFromServiceID(id) {
        return await this.CalendarDates.findAll({
            where: {
                service_id: id
            }
        })
    }
}

module.exports = { BODSClient, createBoundingBox, TimetablesManager };