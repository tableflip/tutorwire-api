// tutor/index.js
var db = require('../db');
var shortId = require('shortid');
var valid = require('valid');

var validate = valid.validate;
var validators = valid.validators;
var spec = validators.spec;
var str = validators.str;
var len = validators.len;
var and = validators.and;
var num = validators.num;
var opt = validators.opt;
var arr = validators.arr;



module.exports = {

	getOne: function(puid, cb) {
		
		var result = validate(puid, spec(and(str, len(1))));
		
		if(result.errors.length) {
			return cb(result.errors[0]);
		}
		
		db.tutors(function(err, tutors){
			if(err) {
				return cb(err);
			}
			
			tutors.findOne({puid: puid}, {_id: 0}, cb);
		});
	},

	getAll: function(cb){
		db.tutors(function(err, tutors){
			if(err) {
				return cb(err);
			}
			
			tutors.find({}, {_id: 0}).toArray(cb);
		});
	},
	
	getBySubject: function(subject, cb) {
		
		// var result = validate(subject, spec(and(str, len(1))));
		
		// if(result.errors.length) {
		// 	return cb(result.errors[0]);
		// }
		
		db.tutors(function(err, tutors){
			if(err) {
				return cb(err);
			}

			// TODO: Optimise - "$regex can only use an index efficiently when the 
			// regular expression has an anchor for the beginning (i.e. ^) of a string
			// and is a case-sensitive match."
			// @see http://docs.mongodb.org/manual/reference/operator/regex/#op._S_regex
			tutors.find({ subject: { $regex: subject, $options: 'i' } }, {_id: 0}).toArray(cb);
		});
	},

	/**
	 * Get tutors near a lat, lng
	 *
	 * @param {Object} coord
	 * @param {Number} coord.lng Longitude
	 * @param {Number} coord.lat Latitude
	 * @param {Function} cb Callback function
	 */
	getNear: function(coord, cb) {
		
		var result = validate(coord, spec({lat: num, lng: num}));
		
		if(result.errors.length) {
			return cb(result.errors[0]);
		}
		
		db.tutors(function(err, tutors){
			if(err) {
				return cb(err);
			}
			
			tutors.find({ 'location.coords': { $near: [coord.lng, coord.lat] }}, {_id: 0}).toArray(cb);
		});
	},
	
	getSubjects: function(cb) {
		
		db.tutors(function(err, tutors){
			if(err) {
				return cb(err);
			}

			tutors.distinct('subject', cb);
		});
	},
	
	add: function(data, cb){
		
		// var result = validate(data, spec({
		// 	email: and(str, len(1)),
		// 	name: and(str, len(1)),
		// 	location: opt({
		// 		name: and(str, len(1)),
		// 		coords: {lat: num, lng: num}
		// 	}),
		// 	subject: opt(str, len(1))
		// }));

		// if(result.errors.length) {
		// 	return cb(result.errors[0]);
		// }
		
		data.puid = shortId.generate();
		
		db.tutors(function(err, tutors){
			if(err) {
				return cb(err);
			}
			
			tutors.insert(data, function(err, tutor) {
				if(err) {
					return cb(err);
				}
				console.log('Added tutor',tutor);
				
				var res = tutor[0];
				delete res._id;
				cb(err, res);
			});
		});
	},
	
	update: function(puid, data, cb) {
		
		var result = validate({puid: puid, data: data}, spec({
			puid: and(str, len(1)),
			data: {
				name: opt(and(str, len(1))),
				location: opt({
					name: and(str, len(1)),
					coords: {lat: num, lng: num}
				}),
				subject: opt(str, len(1))
			}
		}));
		
		if(result.errors.length) {
			return cb(result.errors[0]);
		}
		
		db.tutors(function(err, tutors){
			if(err) {
				return cb(err);
			}
			
			tutors.update({puid: puid}, {$set: data}, function(err, tutor) {
				if(err) {
					return cb(err);
				}
				
				tutors.findOne(tutor._id, {_id: 0}, cb);
			});
		});
	}
};
