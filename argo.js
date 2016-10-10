#!/usr/bin/env node

"use strict"
let fs = require('fs');
let through2Concurrent = require('through2-concurrent');
let csv = require('fast-csv');
let request = require('request');
let rateLimit = require('function-rate-limit');
let commandLineArgs = require('command-line-args')

let optionDefinitions = [
  { name: 'input', alias: 'i', type: String },
  { name: 'output', alias: 'o', type: String },
  { name: 'auth', alias: 'a', type: String },
  { name: 'rate', alias: 'r', type: Number, defaultValue: 6 },
  { name: 'latitudefield', alias: 'n', type: String, defaultValue: 'latitude'},
  { name: 'longitudefield', alias: 'w', type: String, defaultValue: 'longitude'},
]

let options = commandLineArgs(optionDefinitions)

if (options.input) {
  console.log('Processing ' + options.input)
} else {
  console.log('Please specify an input file')
  exit()
}
if (options.auth) {
  console.log('*******************************')
} else {
  console.log('Please specify a Mapzen authorization key. Get one here: https://mapzen.com/developers/')
  exit()
}
// params
let urlBase = 'https://search.mapzen.com/v1/reverse?layers=address&sources=oa,osm&api_key=';
let limit = options.rate
let inputFile = options.input
let outputFile = options.output || 'out_' + inputFile
let latField = options.latitudefield
let lonField = options.longitudefield
let mzKey = options.auth
let failures = 0;
let successes = 0;

let interval = setInterval(function(){
  console.log('matched: ' + successes + ' - unmatched: ' + failures);
}, 10000);

let getAddress = rateLimit(limit, 1000, function (point, callback, attempts) {
  attempts = attempts || 0;
  if (attempts === 5) {
    console.log('Failed after 5 attempts :(', point);
    callback();
  }

  request(urlBase + mzKey + '&point.lat=' + point[latField]+ '&point.lon=' + point[lonField], function (error, response, body) {
    if (error) {
      console.error('encountered error', error instanceof Error ? error.stack : error);
      getAddress(point, callback, attempts + 1);
    } else if (response.statusCode === 429) {
      getAddress(point, callback, attempts + 1);
    } else if (response.statusCode !== 200) {
      console.error('non-200 status code: ' + response.statusCode);
      getAddress(point, callback, attempts + 1);
    } else {
      body = JSON.parse(body);
      if (body.features[0]) {
        let featurePoint = body.features[0].properties;
        point['mz_house_number'] = featurePoint.housenumber;
        point['mz_hnst'] = featurePoint.name;
        point['mz_city'] = featurePoint.locality || featurePoint.localadmin || '';
        point['mz_state'] = featurePoint.region_a;
        point['mz_zip'] = featurePoint.postalcode || '';
        point['mz_label'] = featurePoint.label;
        point['mz_confidence'] = featurePoint.confidence;
        point['mz_distance'] = featurePoint.distance;
        point['mz_source'] = featurePoint.source;
        successes++;
      } else {
        point['mz_house_number'] = '';
        point['mz_hnst'] = '';
        point['mz_city'] = '';
        point['mz_state'] = '';
        point['mz_zip'] = '';
        point['mz_label'] = '';
        point['mz_confidence'] = '';
        point['mz_distance'] = '';
        point['mz_source'] = '';
        failures++;
      }
      if (body.features[1]) {
        let featurePoint2 = body.features[1].properties;
        point['mz_backup_house_number'] = featurePoint2.housenumber;
        point['mz_backup_hnst'] = featurePoint2.name;
        point['mz_backup_city'] = featurePoint2.locality || featurePoint2.localadmin || '';
        point['mz_backup_state'] = featurePoint2.region_a;
        point['mz_backup_zip'] = featurePoint2.postalcode || '';
        point['mz_backup_label'] = featurePoint2.label;
        point['mz_backup_confidence'] = featurePoint2.confidence;
        point['mz_backup_distance'] = featurePoint2.distance;
        point['mz_backup_source'] = featurePoint2.source;
      } else {
        point['mz_backup_house_number'] = '';
        point['mz_backup_hnst'] = '';
        point['mz_backup_city'] = '';
        point['mz_backup_state'] = '';
        point['mz_backup_zip'] = '';
        point['mz_backup_label'] = '';
        point['mz_backup_confidence'] = '';
        point['mz_backup_distance'] = '';
        point['mz_backup_source'] = '';
      }
      callback(null, point);
    }
  })
});

csv
  .fromPath(inputFile, {objectMode: true, headers: true})
  .pipe(through2Concurrent.obj(
    {maxConcurrency: limit},
    function (row, enc, callback) {
      getAddress(row, callback);
    }
  ))
  .pipe(csv.createWriteStream({headers: true}))
  .pipe(fs.createWriteStream(outputFile))
  .on('finish', function(){
    console.log('Finished reverse geocoding file "' + outputFile + '"')
    clearInterval(interval);
  });