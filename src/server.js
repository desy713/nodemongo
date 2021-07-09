'use strict';

const express = require('express');

const MongoClient = require('mongodb').MongoClient;

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT || 27017;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const url = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to Webproject');
  console.log(DB_USER);
  console.log(url);
});


app.get('/records', (req, res) => {
  MongoClient.connect(url, function(err, db) {
    if (err) res.status(500).send(err);
    var dbo = db.db(DB_NAME);
    dbo.collection("records").find({}).toArray(function(err, result) {
      if (err) res.status(500).send(err);
      else {
        res.status(200).send(result);
        db.close();
      }
    });
  });
});

app.get('/record', (req, res) => {
  MongoClient.connect(url, function(err, db) {
    if (err) res.status(500).send(err);
    var dbo = db.db(DB_NAME);
    var record = { value: Math.random() };
    dbo.collection("records").insertOne(record, function(err, result) {
      if (err) res.status(500).send(err);
      else {
        res.status(200).send("Inserted a random value into database");
        db.close();
      }
    });
  });
});

app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK');
});

app.get('/metrics', (req, res) => {
  // Prometheus Metrics
  // Database connection status metric sent in Prometheus format:
  // Ref: https://prometheus.io/docs/instrumenting/exposition_formats/
  console.log('Connecting to database on URL: "%s"', url)
  MongoClient.connect(url, function(err, db) {
    if (err) res.send(`database_up{host="${DB_HOST}",database="${DB_NAME}"} 0 ` 
                      + Math.floor(new Date() / 1000));
    else {
      res.send(`database_up{host="${DB_HOST}",database="${DB_NAME}"} 1 ` 
                + Math.floor(new Date() / 1000));
      db.close();
    }
  });
});

// Create 'records' collection
MongoClient.connect(url, function(err, db) { 
  var dbo = db.db(DB_NAME);
  dbo.createCollection("records", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
