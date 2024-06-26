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

// initialize image variables
var imgHold = [];
var imagesHold = [];

module.exports = function(router) {

    // route for getting all the robots out of the db
    router.get("/getAllRobots", function(req, res) {
        db.Robot.find({})
            .then(function(dbAllRobots) {
                //console.log("dbAllRobots from /getAllRobots; ", dbAllRobots);
                res.json(dbAllRobots);
            })
            .catch(function(err) {
                // or send the error
                res.json(err);
            });
    });
  
    // Route for getting a specific Robot by id, and then populate it with an array for Images
    router.get("/popRobot/:id", function(req, res) {
        // Using the id passed in the id parameter, and make a query that finds the matching one in the db
        db.Robot.findOne({ _id: req.params.id })
            // then populate the kitten schema associated with it
            .populate([
                {
                    path: "image",
                    model: "Image"
                }
            ])
            .then(function(dbRobot) {
            // If successful, find a User with the given id, send it back to the client
            console.log("api-routes.js, JUST POPULATE ROBOT, dbRobot: ", dbRobot);
            res.json(dbRobot);
            })
            .catch(function(err) {
            // but if an error occurred, send it to the client
            res.json(err);
            });
    });

    // Route for creating a new Robot
    router.get("/createRobot/", function(req, res) {
        console.log("from /createRobot, req.query: ", req.query);
        db.Robot.create(req.query)
            .then(function(dbRobot) {
                // View the added result in the console
            console.log("what was created in the robot db, dbRobot: ", dbRobot);
            res.json(dbRobot);
            })
            .catch(function(err) {
            // If an error occurred, send it to the client
            return res.json(err);
            });
    });

    //This is Step 8 from notes on uploading the images chosen by the user
    //It's now being called from robot.js, not directly from html form
    // 
    router.post("/createImageRobot/:id", upload.single("robotImageInput"), (req, res, next) => {
        console.log("from api-routes step 8, req.file.filename: ", req.file.filename);
        console.log("req.body.title: ", req.body.title);
        console.log("req.body.desc: ", req.body.desc);
        if (req.body.title === "") {
            req.body.title = "Title";
        }
        if (req.body.desc === "") {
            req.body.desc = "Description";
        }
        var obj = {
            title: req.body.title,
            desc: req.body.desc,
            img: {
                data: fs.readFileSync(path.join(__dirname + "/../uploads/" + req.file.filename)),
                contentType: "image/jpeg"
            }
        }
        db.Image.create(obj)
            .then(function(dbImage) {
                //console.log("after .create Image - dbImage: ", dbImage);
                //pushing the new kitten image into the document kitten array
                return db.Robot.findOneAndUpdate(
                    { _id: req.params.id },
                    { $push: { image: dbImage._id } },
                    { new: true }
                );
            })
            .then(function(dbRobot) {
                //send back the correct robot with the new data in the image array
                res.json(dbRobot);

            })
            .catch(function(err) {
                //If an error occurred, send back
                res.json(err);
            });
    });

    //This route gets one robot document from robot collection
    router.get("/getARobot/:id", function(req, res) {
        //console.log("inside api-routes: req.params: ", req.params);
        // need to find the correct robot, and retrieve it's data, 
        db.Robot.find({ _id: req.params.id })
            .then(function(dbARobot) {
                res.json(dbARobot);
                console.log("from route /getARobot:id, dbARobot: ", dbARobot);
            })
            .catch(function(err) {
            // However, if an error occurred, send it to the client
            res.json(err);
            });
    });
    
    // the GET route for getting all the images from one robot in the db
    router.get("/getImages/:id" , (req, res) => {
        //console.log("in /getImages/, req.params.id: ", req.params.id );
            db.Image.find({ _id: req.params.id})
            .then((records) => {
                // console.log("this is records from api route /getImages/: ", records);
                //for loop to create array of robot images from records from db
                //study: I'm only getting one record, instead of all of them, so this loop doesn't really need to be here,
                // it's only going through once, and client side has the .forEach to go through the full array. Leaving it for now...
                for (i=0; i<records.length; i++) {
                    imgHold[i] = Buffer.from(records[i].img.data, "base64");
                    imagesHold.push(imgHold[i]);
                }
                //console.log("inside /getImages/, records[0]._id: " + records[0]._id);
                //console.log("inside /getImages/, records[0].title: " + records[0].title);
                const formattedImages = imagesHold.map(buffer => {
                    //return `<img data-title=` + records[0].title + ` data-id=` + records[0]._id + ` class="theImages" title=` + records[0].title + ` src="data:image/jpeg;base64,${buffer.toString("base64")}"/>`
                    return `<img data-id=` + records[0]._id + ` id="robotImg" class="theImages" data-desc="` + records[0].desc + 
                    `" title="` + records[0].title + `" alt="robotpic" src="data:image/jpeg;base64,${buffer.toString("base64")}"/>`
                });
                res.send(formattedImages)  //this should be going back to robots.js
                //empty out arrays
                imgHold = [];
                imagesHold = [];
            })
                .catch(error => {
                    console.log("Iam getting an error", error);
                });
        
    });

    // changing the name of a robot in the db
       
       router.post("/editRobotName/:robotId", function(req, res) {
        console.log("req.params.robotId: ", req.params.robotId);
        //console.log("req.body: ", req.body);
        console.log("req.body.name: ", req.body.name);
        // if the name has been emptied out by mistake, "None" should be entered insted of blank
        if (req.body.name === "") {
            req.body.name = "Name";
        }
        // find the intended robot properties, and change the values accordingly
        db.Robot.findOneAndUpdate (
            { _id: req.params.robotId },
            {$set: { 
                name: req.body.name, 
            }},
            { new: true } //send new one back
        )
            .then(function(dbRobot) {
                console.log("dbRobot: ", dbRobot);
                // If successful, send the newly edited data back to the client
                res.json(dbRobot);
            })
            .catch(function(err) {
            // but if an error occurred, send it to the client
                res.json(err);
            });
    });

    // changing the bio of a robot in the db
       
    router.post("/editRobotBio/:robotId", function(req, res) {
        console.log("req.params.robotId: ", req.params.robotId);
        //console.log("req.body: ", req.body);
        console.log("req.body.bio: ", req.body.bio);
        // if bio has been emptied out, "None" should be entered insted of blank
        if (req.body.bio === "") {
            req.body.bio = "Biography";
        }
        // find the intended robot properties, and change the values accordingly
        db.Robot.findOneAndUpdate (
            { _id: req.params.robotId },
            {$set: { 
                bio: req.body.bio, 
            }},
            { new: true } //send new one back
        )
            .then(function(dbRobot) {
                console.log("dbImage: ", dbRobot);
                // If successful, send the newly edited data back to the client
                res.json(dbRobot);
            })
            .catch(function(err) {
            // but if an error occurred, send it to the client
                res.json(err);
            });
    });

    // changing the order of a robot in the db
       
    router.post("/editRobotOrder/:robotId", function(req, res) {
        console.log("req.params.robotId: ", req.params.robotId);
        //console.log("req.body: ", req.body);
        console.log("req.body.order: ", req.body.order);
        // if order has been emptied out, "None" should be entered insted of blank
        if (req.body.order === "") {
            req.body.order = "3000"; //should this be something besides a string?
        }
        // find the intended robot properties, and change the values accordingly
        db.Robot.findOneAndUpdate (
            { _id: req.params.robotId },
            {$set: { 
                order: req.body.order, 
            }},
            { new: true } //send new one back
        )
            .then(function(dbRobot) {
                console.log("dbImage: ", dbRobot);
                // If successful, send the newly edited data back to the client
                res.json(dbRobot);
            })
            .catch(function(err) {
            // but if an error occurred, send it to the client
                res.json(err);
            });
    });

    // changing the title of an image in the db
       //Route to edit the title of a kitten's image
    router.post("/editImageTitle/:imageId", function(req, res) {
        console.log("req.params.imageId: ", req.params.imageId);
        //console.log("req.body: ", req.body);
        console.log("req.body.title: ", req.body.title);
        // if title has been emptied out, "None" should be entered insted of blank
        if (req.body.title === "") {
            req.body.title = "Title";
        }
        // find the intended image properties, and change the values accordingly
        db.Image.findOneAndUpdate (
            { _id: req.params.imageId },
            {$set: { 
                title: req.body.title, 
            }},
            { new: true } //send new one back
        )
            .then(function(dbImage) {
                console.log("dbImage: ", dbImage);
                // If successful, send the newly edited data back to the client
                res.json(dbImage);
            })
            .catch(function(err) {
            // but if an error occurred, send it to the client
                res.json(err);
            });
    });

    // changing the description of an image in the db
       //Route to edit the description of a kitten's image
       router.post("/editImageDesc/:imageId", function(req, res) {
        console.log("req.params.imageId: ", req.params.imageId);
        //console.log("req.body: ", req.body);
        console.log("req.body.desc: ", req.body.desc);
        // if desc has been emptied out, "None" should be entered insted of blank
        if (req.body.desc === "") {
            req.body.desc = "Description";
        }
        // find the intended image properties, and change the values accordingly
        db.Image.findOneAndUpdate (
            { _id: req.params.imageId },
            {$set: { 
                desc: req.body.desc, 
            }},
            { new: true } //send new one back
        )
            .then(function(dbImage) {
                console.log("dbImage: ", dbImage);
                // If successful, send the newly edited data back to the client
                res.json(dbImage);
            })
            .catch(function(err) {
            // but if an error occurred, send it to the client
                res.json(err);
            });
    });

    // This route deletes the image Mark wants to delete
    router.delete("/image/delete/:id", function(req, res) {
        console.log("in image/delete, req.params.id: ", req.params.id);
        // delete the whole metric group
        db.Image.deleteOne(
            { _id: req.params.id }
        )
        .then(function(dbImage) {
            //  
            console.log("delete an image, dbImage: ", dbImage);
            res.json(dbImage);
        })
        .catch(function(err) {
            // but if an error occurred, send it to the client
            res.json(err);
        });
    });

    // This route deletes the reference to the image document in the associated robot document
    router.post("/robot/removeRef/:id", function(req, res) {
        //console.log("req:", req);
        console.log("remove an image reference: robot id: ", req.params.id);
        console.log("data transferred to remove image reference, req.body: ", req.body);
        console.log("req.body.imageId: ", req.body.imageId);
    // delete (or pull) the id of the image and pass the req.body to the entry
    db.Robot.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { image: req.body.imageId }}, // this imageid should be the image's id to be removed
        { new: true }
    )
        .then(function(dbRobot) {
            console.log("after .then db.Robot.findOneAndUpdate $pull, dbRobot: ", dbRobot);
            res.json(dbRobot);
        })
        .catch(function(err) {
        // If an error occurred, send it to the client
            res.json(err);
        });
    });

    // This route deletes the kitten the user wants to delete
    router.delete("/robot/delete/:id", function(req, res) {
        console.log("in /robot/delete, req.params: ", req.params);
        console.log("in /robot/delete/, req.params.id: ", req.params.id);
        // delete the whole robot group
        db.Robot.deleteOne(
            { _id: req.params.id }
        )
        .then(function(dbRobot) {
            console.log("delete a robot, dbRobot: ", dbRobot);
            res.json(dbRobot);
        })
        .catch(function(err) {
            // but if an error occurred, send it to the client
            res.json(err);
        });
    });
    
};