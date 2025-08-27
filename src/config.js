// Configurable using parameters. Use "-help" when running app to see list of options
const config = {
  NUMBER_OF_CASES: 100,
  TIMEFRAME_IN_YEARS: 2,
  OUTPUT_FORMAT: "csv",
  BATCH_SIZE_INSERT_SQL: 1000,
  MIN_EVENTS: 3,
  MAX_EVENTS: 10,
  MIN_DAYS_BETWEEN_EVENTS: 1,
  MAX_DAYS_BETWEEN_EVENTS: 3,
  MIN_HOURS_BETWEEN_EVENTS: 1,
  MAX_HOURS_BETWEEN_EVENTS: 3,
  MIN_MINUTES_BETWEEN_EVENTS: 1,
  MAX_MINUTES_BETWEEN_EVENTS: 3,
  SHOW_PROGRESS: true,
  PROGRESS_INTERVAL: 1100,
  FILE_NAME_PREFIX: "Cases",
  INCLUDE_RECORD_COUNT_IN_FILE_NAME: true,
  DYNAMIC_ATTRS: 0,
  UNIQUE_VALUES_FOR_DYNAMIC_ATTRS: 10,
  MAX_VARIANTS: -1,
  MAX_SEQUENCES: -1,
  SHOW_SUMMARY: true,
  DUAL_TIMESTAMP_MODE: true,
  TIMESTAMP_1_DATE: "2024-01-01",
  TIMESTAMP_2_DATE: "2024-06-01"
};

function loadAndSetUserConfigurations() {
  const args = process.argv.slice(2);

  if (args.includes("-help")) {
    printHelp();
    return;
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "-cases" && i + 1 < args.length) {
      config.NUMBER_OF_CASES = parseFloat(nextArg);
    } else if (arg === "-timeframe" && i + 1 < args.length) {
      config.TIMEFRAME_IN_YEARS = parseFloat(nextArg);
    } else if (arg === "-format" && i + 1 < args.length) {
      config.OUTPUT_FORMAT = nextArg.toLowerCase();
    } else if (arg === "-sqlbatchsize" && i + 1 < args.length) {
      config.BATCH_SIZE_INSERT_SQL = parseFloat(nextArg);
    } else if (arg === "-minevents" && i + 1 < args.length) {
      config.MIN_EVENTS = parseFloat(nextArg);
    } else if (arg === "-maxevents" && i + 1 < args.length) {
      config.MAX_EVENTS = parseFloat(nextArg);
    } else if (arg === "-mindays" && i + 1 < args.length) {
      config.MIN_DAYS_BETWEEN_EVENTS = parseFloat(nextArg);
    } else if (arg === "-maxdays" && i + 1 < args.length) {
      config.MAX_DAYS_BETWEEN_EVENTS = parseFloat(nextArg);
    } else if (arg === "-minhours" && i + 1 < args.length) {
      config.MIN_HOURS_BETWEEN_EVENTS = parseFloat(nextArg);
    } else if (arg === "-maxhours" && i + 1 < args.length) {
      config.MAX_HOURS_BETWEEN_EVENTS = parseFloat(nextArg);
    } else if (arg === "-minminutes" && i + 1 < args.length) {
      config.MIN_MINUTES_BETWEEN_EVENTS = parseFloat(nextArg);
    } else if (arg === "-maxminutes" && i + 1 < args.length) {
      config.MAX_MINUTES_BETWEEN_EVENTS = parseFloat(nextArg);
    } else if (arg === "-progress" && i + 1 < args.length) {
      config.SHOW_PROGRESS = (nextArg.toLowerCase() == "true")
    } else if (arg === "-progressinterval" && i + 1 < args.length) {
      config.PROGRESS_INTERVAL = parseFloat(nextArg)
    } else if (arg === "-prefix" && i + 1 < args.length) {
      config.FILE_NAME_PREFIX = nextArg;
    } else if (arg === "-verbosename" && i + 1 < args.length) {
      config.INCLUDE_RECORD_COUNT_IN_FILE_NAME = (nextArg.toLowerCase() == "true")
    } else if (arg === "-dynamicattrs" && i + 1 < args.length) {
      config.DYNAMIC_ATTRS = parseFloat(nextArg);
    } else if (arg === "-uniquevalues" && i + 1 < args.length) {
      config.UNIQUE_VALUES_FOR_DYNAMIC_ATTRS = parseFloat(nextArg);
    } else if (arg === "-maxvariants" && i + 1 < args.length) {
      config.MAX_VARIANTS = parseFloat(nextArg);
    } else if (arg === "-maxsequences" && i + 1 < args.length) {
      config.MAX_SEQUENCES = parseFloat(nextArg);
    } else if (arg === "-summary" && i + 1 < args.length) {
      config.SHOW_SUMMARY = (nextArg.toLowerCase() == "true")
    }
  }
}

function printHelp() {
  console.log("\nUsage:");
  console.log(
    "node app.js -cases [value] -timeframe [value] -format [value] -sqlbatchsize [value] -minevents [value] -maxevents [value] -mindays [value] -maxdays [value] -minhours [value] -maxhours [value] -minminutes [value] -maxminutes [value] -progress [value] -progressinterval [value] -dynamicattrs [value] -uniquevalues [value]\n"
  );
  console.log(
    `-cases: The number of cases to generate. (Default: ${config.NUMBER_OF_CASES})`
  );
  console.log(
    `-timeframe: The amount of years to use as the timeframe of event dates. (Default: ${config.TIMEFRAME_IN_YEARS})`
  );
  console.log(
    `-format: The format to use for the output (csv or sql). (Default: ${config.OUTPUT_FORMAT})`
  );
  console.log(
    `-sqlbatchsize: The number rows to include with each SQL INSERT statement. (Default: ${config.BATCH_SIZE_INSERT_SQL})`
  );
  console.log(
    `-minevents: The minimum number of events to create for each case. (Default: ${config.MIN_EVENTS})`
  );
  console.log(
    `-maxevents: The minimum number of events to create for each case. (Default: ${config.MAX_EVENTS})`
  );
  console.log(
    `-mindays: The minimum number of days between events. (Default: ${config.MIN_DAYS_BETWEEN_EVENTS})`
  );
  console.log(
    `-maxdays: The maximum number of days between events. (Default: ${config.MAX_DAYS_BETWEEN_EVENTS})`
  );
  console.log(
    `-minhours: The minimum number of hours between events. (Default: ${config.MIN_HOURS_BETWEEN_EVENTS})`
  );
  console.log(
    `-maxhours: The maximum number of hours between events. (Default: ${config.MAX_HOURS_BETWEEN_EVENTS})`
  );
  console.log(
    `-minminutes: The minimum number of minutes between events. (Default: ${config.MIN_MINUTES_BETWEEN_EVENTS})`
  );
  console.log(
    `-maxminutes: The maximum number of minutes between events. (Default: ${config.MAX_MINUTES_BETWEEN_EVENTS})`
  );
  console.log(
    `-progress: Enable/Disable a progress indicator. (Default: ${config.SHOW_PROGRESS})`
  );
  console.log(
    `-progressinterval: How often to update the progress indicator. A value of 100 means that every 100 cases it updates the progress indicator. (Default: ${config.PROGRESS_INTERVAL})`
  );
  console.log(
    `-prefix: The prefix for the name of the generated files. (Default: ${config.FILE_NAME_PREFIX})`
  );
  console.log(
    `-verbosename: Whether to include the record count in the "-all" file name. (Default: ${config.INCLUDE_RECORD_COUNT_IN_FILE_NAME})`
  );
  console.log(
    `-dynamicattrs: Number of dynamically generated case attributes. (Default: ${config.DYNAMIC_ATTRS})`
  );
  console.log(
    `-uniquevalues: Number of unique values for each dynamically generated case attribute. (Default: ${config.UNIQUE_VALUES_FOR_DYNAMIC_ATTRS})`
  );
  console.log(
    `-maxvariants: Maximum number of unique variants. (Default: None)`
  );
  console.log(
    `-maxsequences: Maximum number of unique event sequences. (Default: None)`
  );
  console.log(
    `-summary: Display data summary on the console. (Default: ${config.SHOW_SUMMARY})`
  );
  console.log("\n");
}

module.exports = { config, loadAndSetUserConfigurations, printHelp };
