const { faker } = require("@faker-js/faker");
const moment = require("moment");
const { getRandomString, getVocabulary } = require("./vocabulary");
const { config } = require("./config");
const { showProgress } = require("./progress");

const uniqueVariants = new Set();
const uniqueSequences = new Set();
const variantsMap = {};
let variantsCount = 0;

function generateCases(numCases) {
  const cases = [];
  let vocabulary = getVocabulary();

  for (let i = 1; i <= numCases; i++) {
    const caseRecord = {};

    vocabulary.schema.cases.columns.forEach((field) => {
      if (field.primary_key) {
        caseRecord._id = i;
        caseRecord[field.display_name] = i;
      } else if (field.name === 'start_date') {
        const startDate = config.DUAL_TIMESTAMP_MODE 
          ? config.TIMESTAMP_1_DATE
          : faker.date.past({ years: config.TIMEFRAME_IN_YEARS });
        caseRecord[field.display_name] = moment(startDate).format("YYYY-MM-DD HH:mm:ss.SSS");
      } else if (field.name === 'end_date') {
        const endDate = config.DUAL_TIMESTAMP_MODE 
          ? config.TIMESTAMP_2_DATE
          : faker.date.recent({ days: 30 });
        caseRecord[field.display_name] = moment(endDate).format("YYYY-MM-DD HH:mm:ss.SSS");
      } else {
        caseRecord[field.display_name] = getRandomString(field.name);
      }
    });

    cases.push(caseRecord);
    if (config.SHOW_PROGRESS && i % config.PROGRESS_INTERVAL == 0) {
      showProgress((i / numCases) * 100, (text = "Generating cases"));
    }
  }

  if (config.SHOW_PROGRESS) {
    showProgress(100, (text = "Generating cases"));
    process.stdout.write("\n");
  }
  return cases;
}

function generateEvents(cases) {
  const transitions = [];
  const numCases = cases.length;

  let caseNumber = 0,
    eventId = 1;
  for (const caseRecord of cases) {
    const numTransitions = faker.number.int({
      min: config.MIN_EVENTS,
      max: config.MAX_EVENTS,
    });
    caseNumber++;

    const vocabulary = getVocabulary();
    const startDate = config.DUAL_TIMESTAMP_MODE 
      ? config.TIMESTAMP_1_DATE
      : faker.date.past({ years: config.TIMEFRAME_IN_YEARS });
    let currentDate = moment(startDate);

    const variant = generateEventVariant()
    for (const eventName of variant) {
      const event = {};
      vocabulary.schema.events.columns.forEach((field) => {
        if (field.primary_key) {
          event[field.display_name] = event._id = eventId++;
        } else if (field.is_case_id) {
          event[field.display_name] = caseRecord._id;
        } else if (field.event_action) {
          event[field.display_name] = field.foreign_key ? valueToForeignKey(eventName, field.name) : eventName;
        } else if (field.event_date) {
          event[field.display_name] = currentDate.format(
            "YYYY-MM-DD HH:mm:ss.SSS"
          );
        } else if (field.foreign_key) {
          event[field.display_name] = valueToForeignKey(getRandomString(field.name), field.name);
        } else {
          event[field.display_name] = getRandomString(field.name);
        }
      });

      transitions.push(event);
      currentDate.add({
        days: faker.number.int({
          min: config.MIN_DAYS_BETWEEN_EVENTS,
          max: config.MAX_DAYS_BETWEEN_EVENTS,
        }),
        hours: faker.number.int({
          min: config.MIN_HOURS_BETWEEN_EVENTS,
          max: config.MAX_HOURS_BETWEEN_EVENTS,
        }),
        minutes: faker.number.int({
          min: config.MIN_MINUTES_BETWEEN_EVENTS,
          max: config.MAX_MINUTES_BETWEEN_EVENTS,
        }),
      });
    }
    if (config.SHOW_PROGRESS && caseNumber % config.PROGRESS_INTERVAL == 0) {
      showProgress(
        (caseNumber / numCases) * 100,
        (text = "Generating events")
      );
    }
  }
  if (config.SHOW_PROGRESS) {
    showProgress(1 * 100, (text = "Generating events"));
    process.stdout.write("\n");
  }

  const stats = {
    cases: numCases,
    events: transitions.length,
    variants: variantsCount,
    sequences: uniqueSequences.size
  };
  if (config.SHOW_SUMMARY) {
    console.log("Jira Tickets Summary: {");
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: \x1b[33m${value}\x1b[0m`);
    });
    console.log("}");
  }
  if (config.MAX_VARIANTS > 0 && variantsCount < config.MAX_VARIANTS) {
    console.warn(`WARN: Number of generated variants (${variantsCount}) did not reach the specified maximum (${config.MAX_VARIANTS}).`);
  }
  if (config.MAX_SEQUENCES > 0 && uniqueSequences.size < config.MAX_SEQUENCES) {
    console.warn(`WARN: Number of generated sequences (${uniqueSequences.size}) did not reach the specified maximum (${config.MAX_SEQUENCES}).`);
  }

  return transitions;
}

function valueToForeignKey(value, table) {
  const vocabulary = getVocabulary();
  return vocabulary.data[table][value];
}

/* This function generates a variant, which is defined as a collection of sequences. 
   Each sequence consists of a pair of events. */
function generateEventVariant() {
  // Check if we can create more variants based on MAX_VARIANTS configuration
  if (uniqueVariants.size < config.MAX_VARIANTS || config.MAX_VARIANTS < 0) {
    const initialEvent = getRandomString("__initial_events__");
    const finalEvents = getVocabulary().finalEvents;
    const numTransitions = faker.number.int({
      min: config.MIN_EVENTS,
      max: config.MAX_EVENTS,
    });

    const variant = [initialEvent];
    let previousEvent = initialEvent;

    for (let i = 1; i < numTransitions; i++) {
      let eventName;
      // If we've reached the maximum allowed unique sequences, reuse existing ones
      if (uniqueSequences.size >= config.MAX_SEQUENCES && config.MAX_SEQUENCES > 0) {
        // Find all sequences that start from previousEvent
        let possibleNextEvents = Array.from(uniqueSequences)
          .filter(seq => seq.startsWith(`${previousEvent}->`))
          .map(seq => seq.split("->")[1]); // Extract the end events

        // If we're on the last transition, filter possibleNextEvents to include only final events
        if (i === numTransitions - 1) {
          possibleNextEvents = possibleNextEvents.filter(event => event in finalEvents);
        }

        // If possibleNextEvents is empty, fall back to normal sequence generation.
        // This may result in num of sequences to exceed MAX_SEQUENCES, which is OK!
        if (possibleNextEvents.length > 0) {
          eventName = getRandomString(previousEvent, possibleNextEvents);
        } else {
          if (i === numTransitions - 1) {
            eventName = getRandomString(previousEvent, Object.keys(finalEvents));
          } else {
            eventName = getRandomString(previousEvent);
          }
          uniqueSequences.add(`${previousEvent}->${eventName}`);
        }
      } else {
        // Generate a completely new sequence (when MAX_SEQUENCES limit not reached)
        if (i === numTransitions - 1) {
          eventName = getRandomString(previousEvent, Object.keys(finalEvents));
        } else {
          eventName = getRandomString(previousEvent);
        }
        uniqueSequences.add(`${previousEvent}->${eventName}`);
      }

      variant.push(eventName);
      previousEvent = eventName;

      if (eventName in finalEvents) break;
    }

    const variantStr = variant.join("->");
    if (!uniqueVariants.has(variantStr)) {
      uniqueVariants.add(variantStr);
      variantsMap[variantsCount++] = variant;
    }

    return variant;
  } else {
    // If maximum variants are reached, return a randomly selected pre-generated variant
    const randomIndex = Math.floor(Math.random() * variantsCount);
    return variantsMap[randomIndex];
  }
}

module.exports = { generateCases, generateEvents };
