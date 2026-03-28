const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

let database;

const initDb = (callback) => {
  if (database) {
    return callback(null, database);
  }

  MongoClient.connect(process.env.MONGODB_URI)
    .then((client) => {
      database = client.db();
      callback(null, database);
    })
    .catch((err) => {
      callback(err);
    });
};

const getDb = () => {
  return database;
};

module.exports = { initDb, getDb };