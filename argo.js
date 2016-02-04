// USAGE: node argo.js <input filename> <output filename> <mapzen search key>
var fs = require('fs');
var through2Concurrent = require('through2-concurrent');
var csv = require('fast-csv');
var request = require('request');
var rateLimit = require('function-rate-limit');

// params
var urlBase = 'https://search.mapzen.com/v1/reverse?api_key=';
var limit = 6;
var inputFile = process.argv[2];
var outputFile = process.argv[3];
var mzKey = process.argv[4];

var failures = 0;

var getAddress = rateLimit(limit, 1000, function (point, callback, attempts) {
  attempts = attempts || 0;
  if (attempts === 5) {
    failures++;
    console.log('Failed after 5 attempts :(', point);
    callback();
  }

  request(urlBase + mzKey + '&point.lat=' + point.latitude + '&point.lon=' + point.longitude, function (error, response, body) {
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
      var featurePoint = body.features[0].properties;
      point['mz_house_number'] = featurePoint.housenumber;
      point['mz_hnst'] = featurePoint.name;
      point['mz_city'] = featurePoint.locality;
      point['mz_state'] = featurePoint.region_a;
      point['mz_confidence'] = featurePoint.confidence;
      point['mz_distance'] = featurePoint.distance;
      point['mz_source'] = featurePoint.source;
      if (body.features[1]) {
        var featurePoint2 = body.features[1].properties;
        point['mz_backup_house_number'] = featurePoint2.housenumber;
        point['mz_backup_hnst'] = featurePoint2.name;
        point['mz_backup_city'] = featurePoint2.locality;
        point['mz_backup_state'] = featurePoint2.region_a;
        point['mz_backup_confidence'] = featurePoint2.confidence;
        point['mz_backup_distance'] = featurePoint2.distance;
        point['mz_backup_source'] = featurePoint2.source;
      } else {
        point['mz_backup_house_number'] = '';
        point['mz_backup_hnst'] = '';
        point['mz_backup_city'] = '';
        point['mz_backup_state'] = '';
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
  .pipe(fs.createWriteStream(outputFile));
