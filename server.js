var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// these two are from showing images in mongodb process:
var fs = require('fs');
var path = require('path');


// var sortAges = require("sort-ids");
// var reorder = require("array-rearrange");

// make port ready for deployment on Render as well as local
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

//  morgan logger for logging requests
app.use(logger("dev"));

//  body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
//  express.static to serve the public folder as a static directory
app.use(express.static("public"));

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB

// This block is what was originally in the kittens app
// mongoose.Promise = Promise;
// // set up for deploying on mongodb and developing local
//   if (process.env.DB_URI) {
//     mongoose.connect(process.env.DB_URI);
//   } else {
//     mongoose.connect("mongodb://localhost:27017/simplerobots", { 
//       useNewUrlParser: true, 
//       useUnifiedTopology: true,
//       useFindAndModify: false
//     }, function(err){
//       if(err){
//       console.log("I am gettting an error", err);
//     } else {
//       console.log("mongoose connection is successful on: " + "mongodb://localhost:27017/simplerobots");
//     }
//    });
//   }

// This block is my attempt to make it work with latest mongoose npm
mongoose.Promise = Promise;
    if (process.env.DB_URI) {
      mongoose.connect(process.env.DB_URI);
    } else {
      mongoose.connect("mongodb://localhost:27017/simplerobots")
        .then((res) => {
        console.log("mongoose connection is successful on: " + "mongodb://localhost:27017/simplerobots");
      }).catch(error => {
        console.log("I am gettting an error", error);
      });
    }

// // Routes
require("./routes/api-routes.js")(app);
// require("./routes/html-routes.js")(app);

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
