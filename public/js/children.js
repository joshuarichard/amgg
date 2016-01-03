var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://73.227.187.84:27017';

$(document).ready(function () {
	var loadChildrenPictures = function() {
		//number of children pictures we need
		var numChildrenPicture = $(".child-picture").length; 


		// //function to return all documents in the children collection
		// var findChildren = function(db, callback) {
		//    var cursor = db.collection('children').find( );
		//    cursor.each(function(err, doc) {
		//       assert.equal(err, null);
		//       if (doc != null) {
		//          console.dir(doc);
		//       } else {
		//          callback();
		//       }
		//    });
		// };

		// MongoClient.connect(url, function(err, db) {
		//   assert.equal(null, err);
		//   findRestaurants(db, function() {
		//       db.close();
		//   });
		// });

		
	};
});