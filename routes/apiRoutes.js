const axios = require('axios');
const cheerio = require("cheerio");
const mongoose = require("mongoose");
// Require all models
const db = require("../models");

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoNews";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

module.exports = function (app) {
    // landing page index.handlebars
    app.get('/', function (req, res) {
        db.Article.find({ saved: false }, function (err, data) {
            res.render('index', { home: true, article: data });
        })
    });

    // scrape articles
    app.get("/api/fetch", function (req, res) {
        // A GET route for scraping the nytimes website
        // First, we grab the body of the html with axios
        axios.get("https://www.nytimes.com/").then(function (response) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            const $ = cheerio.load(response.data);

            // Now, we grab every h2 within an article tag, and do the following:
            $("article").each(function (i, element) {

                // Save an empty result object
                var result = {};
                result.headline = $(element).find("h2").text().trim();
                result.url = 'https://www.nytimes.com' + $(element).find("a").attr("href");
                result.summary = $(element).find("p").text().trim();

                if (result.headline !== '' && result.summary !== '') {
                    db.Article.findOne({ headline: result.headline }, function (err, data) {
                        if (err) {
                            console.log(err)
                        } else {
                            if (data === null) {
                                db.Article.create(result)
                                    .then(function (dbArticle) {
                                        console.log(dbArticle)
                                    })
                                    .catch(function (err) {
                                        // If an error occurred, send it to the client
                                        console.log(err)
                                    });
                            }
                            console.log(data)
                        }
                    });
                }

            });

            // If we were able to successfully scrape and save an Article, send a message to the client
            res.send("Scrape completed!");
        });
    });

    // route to saved artcles page
    app.get('/saved', function (req, res) {
        db.Article.find({ saved: true }, function (err, data) {
            res.render('savedArticles', { home: false, article: data });
        })
    });

    // save article
    app.put("/api/save/:id", function (req, res) {
        console.log(req.params.id);
        db.Article.updateOne({ _id: req.params.id }, { $set: { saved: true } }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                return res.send(true)
            }
        });
    });

    // add note to an article
    app.post("/api/notes", function (req, res) {
        console.log("inside /api/notes/ " + req.body.noteText)
        // Create a new note and pass the req.body to the entry
        db.Note.create({ noteText: req.body.noteText })
            .then(function (dbNote) {
                console.log('dbNote:' + dbNote)
                // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
                // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
                // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
                return db.Article.findOneAndUpdate({ _id: req.body._headlineId },
                    { $push: { note: dbNote._id } },
                    { new: true })
            })
            .then(function (dbArticle) {
                console.log('dbArticle:' + dbArticle)
                // If we were able to successfully update an Article, send it back to the client
                res.json(dbArticle)
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            })
    });

    // display all notes for a article
    app.get("/api/notes/:id", function (req, res) {
        db.Article.findOne({ _id: req.params.id })
            .populate("note")
            .then(function (dbArticle) {
                console.log(dbArticle.note)
                res.json(dbArticle.note);
            })
            .catch(function (err) {
                res.json(err);
            })
    });

    // delete note by id - delete a single note
    app.delete("/api/notes/:id", function (req, res) {
        console.log('reqbody:' + JSON.stringify(req.params.id))
        db.Note.deleteOne({ _id: req.params.id }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                return res.send(true)
            }
        });
    });

    // delete saved article by id - delete single article
    app.get("/api/deleteSaved/:id", function (req, res) {
        db.Article.deleteOne({ _id: req.params.id }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                console.log(result)
                res.send(true)
            }
        })
    });

    // delete all articles from collection which are not saved
    app.get("/api/clear", function (req, res) {
        db.Article.deleteMany({ saved: false }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                console.log(result)
                res.send(true)
            }
        })
    });

    // delete all articles from collection which are saved
    app.get("/api/clear/saved", function (req, res) {
        db.Article.deleteMany({ saved: true }, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                console.log(result)
                res.send(true)
            }
        })
    });
}