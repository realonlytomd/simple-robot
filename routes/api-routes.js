// nothing in timer
//
// new file that contains the api route information.
// moved from server.js file
//
var express = require("express");
var router = express.Router();
var db = require("../models");
// just the image Schema
//var imgModel = require("../model"); // this is now being removed from code below.
// require method to sort ages array by number
// var sortAges = require("sort-ids");

// var reorder = require("array-rearrange");
var path = require("path");

//following is more from images upload to mongodb process - step 5
//set up multer for storing uploaded files  -- not being used currently, code in server.js
var multer = require("multer");

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads")
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
var upload = multer({ storage: storage });
//and from Step 1 of uploading images to mongodb:
var fs = require('fs');
// still need routes below

module.exports = function(router) { //I'M GOING TO MAKE MARK A USER WITH HIS OWN DATABASE TO MIRROR KITTENS
  
    // Route for getting a specific User by id, and then populate it with a kitten
    router.get("/popMark", function(req, res) {
        // Using the id passed in the id parameter, and make a query that finds the matching one in the db
        db.Robot.findOne({ _id: req.params.id })
            // then populate the kitten schema associated with it
            .populate([
                {
                    path: "robot",
                    model: "Robot",
                    populate: {
                        path: "image",
                        model: "Image"
                    }
                }
            ])
            .then(function(dbMark) {
            // If successful, find a User with the given id, send it back to the client
            console.log("api-routes.js, JUST POPULATE MARK, dbMark: ", dbMark);
            res.json(dbMark);
            })
            .catch(function(err) {
            // but if an error occurred, send it to the client
            res.json(err);
            });
    });
};