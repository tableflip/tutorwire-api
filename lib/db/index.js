var config = require('config');
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var db;

function withDb (cb) {	
	
	if (db) {
		return cb(db);
	}

	console.log('Waitng for db connection');
	
	MongoClient.connect(config.db.url, function (err, database) {
		if (err) {
			console.error('Failed to open db', err);
		} else {
			console.log('Connected to db');
			
			database.collection('tutors', function(err, tutors){
				
				database.ensureIndex('tutors', {'location.coords': '2d'}, function(err, indexName) {
					if(err) return console.error('Failed to create location.coords 2d index', err);

					console.log('Created location index', indexName);

					db = database;
					
					cb(db);
				});

			});
		}
	});
}

module.exports = {

	tutors: function (cb) {
	
		withDb(function (database) {

			database.collection('tutors', cb);
		});
	}
};