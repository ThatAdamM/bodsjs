// This file will convert all the GTFS data from the BODS timetable service into a single JSON file. 
// To be used with the BODSJS package, as it knows how to use it properly.
// However, if you're adventurous, feel free to try using it yourself :)
// Be warned: it is a *very* large file!

// TIP: Run this once every so often to update bus routes. 

// Recipe to making a fresh JSON pie. You will need:
// 1x NodeJS Path making library (included!)
let path = require("path")
// 1x NodeJS FileSystem library (also included!)
let fs = require("fs")
// 1x CSV Convertion library
let Papa = require('papaparse');
// 1x Un-Zipper...
let yauzl = require("yauzl");
const { EventEmitter } = require("stream");
// 1x GTFS ZIP File - Fetch this from the BODS server
let zipurl;

async function createDirIfNotExists(dir) {
    try {
        await fs.promises.mkdir(dir);
    } catch (e) {
        console.warn("[!] Cleanup failed on last download - proceeding anyway.");
    }
}

async function main(region) {
    switch (region ? "--" + region : process.argv[2]) {
        case "--all":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/all/"
            console.log("Fetching all. This is a big one, and might take a while :D")
            break;
        case "--ea":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/east_anglia/"
            break;
        case "--em":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/east_midlands/"
            break;
        case "--england":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/england/"
            break;
        case "--london":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/london/"
            break;
        case "--ne":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/north_east/"
            break;
        case "--nw":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/north_west/"
            break;
        case "--scotland":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/scotland/"
            break;
        case "--se":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/south_east/"
            break;
        case "--sw":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/south_west/"
            break;
        case "--wales":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/wales/"
            break;
        case "--wm":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/west_midlands/"
            break;
        case "--yorkshire":
            zipurl = "https://data.bus-data.dft.gov.uk/timetable/download/gtfs-file/yorkshire/"
            break;
        default:
            console.log("[!] No timetable data download region provided. See github for more info.")
            throw new Error("No download region specified!");
    }
    // Now we download it :)
    require("node-fetch")(zipurl).then(async (res) => {
        console.log("[i] Downloading...")
        let zipWriteStream;
        try {
            await fs.promises.mkdir(path.join(__dirname, "/temp"));
            zipWriteStream = fs.createWriteStream(path.join(__dirname, "/temp/temp.zip"))
        } catch(e) {
            // Ah well, no .zip, no worries :D
        }
        
        res.body.pipe(zipWriteStream);
        res.body.on("end", async () => {
            console.log("[i] Downloaded the requested GTFS ZIP file. Un-zipping")

            // Create folders if needed
            await createDirIfNotExists(path.join(__dirname, "/temp"));
            await createDirIfNotExists(path.join(process.cwd(), "/.bods-data/"));

            // Step 1: Convert the zip to a folder...
            // Open said zip file
            await new Promise((resolve, reject) => {
                yauzl.open(path.join(__dirname, "/temp/temp.zip"), { lazyEntries: true }, (err, zipfile) => {
                    // If it happens to not be a zip file, complain about it >:D
                    if (err) {
                        reject(err)
                    };
                    // Begin reading. Access the first one...
                    zipfile.readEntry();
                    // When it has found one
                    zipfile.on("entry", (entry) => {
                        console.log("[i] Un-zipping", entry.fileName)
                        // Check to see if it's a directory.
                        if (/\/$/.test(entry.fileName)) {
                            // If it is, just get the next entry. We don't need to do anything with directories :)
                            zipfile.readEntry();
                        } else {
                            // If it is a file, lets open it up!
                            zipfile.openReadStream(entry, function (err, readStream) {
                                if (err) throw err;
                                // We should have a UTF8 string. Hopefully 🤞
                                readStream.setEncoding("utf8")
                                // Once done, we'll read the next one...
                                readStream.on("end", function () {
                                    zipfile.readEntry();
                                });
                                // Create a new temporary file
                                readStream.pipe(fs.createWriteStream(path.join(__dirname, "temp", entry.fileName)));
                            });
                        }
                    });

                    zipfile.on("error", (e) => {
                        reject(e)
                    })

                    zipfile.on("end", () => {
                        console.log("[i] Files successfully unzipped.")
                        resolve()
                    })
                })
            })
            // Step 2: Convert the unzipped files to JSON as needed.
            // "WTF do these files mean?"
            // routes.txt lists every service (and their numbers + operators)
            // trips.txt puts together all the info - We use this as a base for the database
            // shapes.txt draws out lines to show where the things go
            // agency.txt matches agency IDs to operators
            // stop_times.txt show what time each service gets to each stop

            // Remove database if it exists...
            try {
                await fs.promises.rm(path.join(process.cwd(), "/.bods-data/database.sqlite"))
            } catch (e) {
                // Oh well, no bother!
            }
            // Create the database to save to:
            let { Sequelize, DataTypes } = require("sequelize");
            const database = new Sequelize({
                dialect: 'sqlite',
                storage: path.join(process.cwd(), "/.bods-data/database.sqlite"),
                logging: () => { }
            });
            // Create database tables
            const Agencies = database.define("Agency", {
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

            const Calendars = database.define("Calendar", {
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

            const CalendarDates = database.define("CalendarDate", {
                service_id: DataTypes.NUMBER,
                date: DataTypes.DATE,
                exception_type: DataTypes.NUMBER
            });

            const Routes = database.define("Route", {
                route_id: {
                    primaryKey: true,
                    type: DataTypes.NUMBER
                },
                agency_id: DataTypes.STRING,
                route_short_name: DataTypes.STRING,
                route_long_name: DataTypes.STRING,
                route_type: DataTypes.NUMBER
            })

            const Shapes = database.define("Shape", {
                shape_id: DataTypes.STRING,
                shape_pt_lat: DataTypes.NUMBER,
                shape_pt_lon: DataTypes.NUMBER,
                shape_pt_sequence: DataTypes.NUMBER,
                shape_dist_travelled: DataTypes.STRING // Unsure why - Should be able to convert to number fine.
            });

            const StopTimes = database.define("StopTime", {
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

            const Stops = database.define("Stop", {
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

            const Trips = database.define("Trip", {
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

            await database.sync();
            console.log(`[i] Database models created!
                Beginning to add to tables. This is gonna take a few minutes. 
                Go grab a coffee, we'll work on it!`)

            let LineByLineReader = require('line-by-line'), totalLinesCount = 0, index = 0;
            async function addAllToDatabase(file, model) {
                let lr = new LineByLineReader(file), headerLine;
                lr.on("error", (e) => {
                    throw e;
                })
                let runningSaves = 0, objs = [];
                lr.on("line", async (line) => {
                    lr.pause();
                    if (!headerLine) {
                        headerLine = line.split(",");
                        lr.resume();
                    } else {
                        let obj = {}, splitline = line.split(",");
                        for (const part in headerLine) {
                            obj[headerLine[part]] = splitline[part];
                        };
                        runningSaves++;

                        objs.push(obj);

                        if (runningSaves > 2056) {

                            await model.bulkCreate(objs);
                            objs = [];
                            runningSaves = 0;
                            
                            lr.resume();
                        } else {
                            lr.resume();
                        }
                    }
                });
                return await new Promise((resolve, reject) => {
                    lr.on("end", async () => {

                        await model.bulkCreate(objs);
                        objs = [];
                        runningSaves = 0;
                        resolve(file);
                        console.log("Done")
                    })
                });
            }

            async function fileLineCount(file) {
                let count = 0, i;
                await new Promise((resolve) => require('fs').createReadStream(file)
                    .on('data', function (chunk) {
                        for (i = 0; i < chunk.length; ++i)
                            if (chunk[i] == 10) count++;
                    })
                    .on('end', function () {
                        resolve()
                    }));

                return count;
            }

            // Parse all...
            let totalDone = 0;
            let filesToConvert = [
                [path.join(__dirname, "/temp/routes.txt"), Routes],
                [path.join(__dirname, "/temp/agency.txt"), Agencies],
                [path.join(__dirname, "/temp/stop_times.txt"), StopTimes],
                [path.join(__dirname, "/temp/shapes.txt"), Shapes],
                [path.join(__dirname, "/temp/stops.txt"), Stops],
                [path.join(__dirname, "/temp/trips.txt"), Trips],
                [path.join(__dirname, "/temp/calendar.txt"), Calendars],
                [path.join(__dirname, "/temp/calendar_dates.txt"), CalendarDates],
            ];

            filesToConvert.forEach(async (file) => {
                addAllToDatabase(file[0], file[1]).then(checkForDone);
                totalLinesCount += await fileLineCount(file[0]);
            });

            // Done! Clean up the other files...
            function checkForDone(fileJustDone) {
                console.log(fileJustDone, "finished processing!")
                totalDone++;
                console.log(totalDone + "/6 Files Done")
                if (totalDone != 6) return;
                console.log("Cleaning up files...")
                fs.readdir(path.join(__dirname, "/temp/"), (err, files) => {
                    if (err) {
                        console.error("[!] Couldn't read data directory: " + err);
                        console.error("[!] Files have been successfully converted.")
                        throw new Error("Failed to download timetable data.")
                    }

                    let txt = files.filter((v) => v.includes(".txt"));
                    for (const f of txt) {
                        fs.rm(path.join(__dirname, "/temp/", f), (err) => {
                            if (err) console.error("[!] Failed to clean up data directory." + err);
                        })
                    }
                    console.log("[🎉] Files have been successfully converted.")
                })
            }
        });
    })
}

if (process.argv[1].endsWith("databaseBuilder.js")) { // Run using the NPM script
    main();
} else {
}

module.exports = main; // Run programatically
