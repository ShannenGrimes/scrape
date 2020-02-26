var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
// var bodyParser = require("body-parser");
// var methodOverride = require('method-override');

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

var PORT = 3000;

// Initialize Express
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Use handlebars for HTML content rendering
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
  })
);
app.set("view engine", "handlebars");

// Connect to the Mongo DB
var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongooseScrape";
mongoose.connect(MONGODB_URI);

// Routes
// Search articles
app.get("/", (req, res) => {
  Article.find({ saved: false }, (error, data) => {
    const hbsObject = {
      article: data
    };
    res.render("index", hbsObject);
  });
});
// Saved articles
app.get("/saved", (req, res) => {
  Article.find({ saved: true })
    .populate("notes")
    .exec((error, articles) => {
      const hbsObject = {
        article: articles
      };
      res.render("saved", hbsObject);
    });
});

// A GET route for scraping the NPR website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.npr.org/sections/politics/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  db.Article.findOne({ _id: req.params.id });
  populate("note")
    .then(function(Article) {
      res.json(Article);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// ROUTE: This will get all the articles we scraped from the mongo DB
app.get("/articles", (req, res) => {
  // Grab every doc in the Articles array
  Article.find({}, (error, doc) => {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// ROUTE: Will get particular article by its ID along with any notes
app.get("/articles/:id", (req, res) => {
  Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(error) {
      res.json(error);
    });
});

// ROUTE: Will save one article
app.post("/articles/save/:id", (req, res) => {
  Article.findOneAndUpdate(
    { _id: req.params.id },
    { saved: true }
  ).exec((error, doc) => (error ? console.log(error) : res.send(doc)));
});

// ROUTE: Make a new note or update existing note
app.post("/notes/save/:id", (req, res) => {
  const newNote = new Note({
    body: req.body.text,
    article: req.params.id
  });
  newNote.save((error, note) => {
    if (error) {
      console.log(error);
    } else {
      Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { notes: note } }
      ).exec(error => {
        if (error) {
          console.log(error);
          res.send(error);
        } else {
          res.send(note);
        }
      });
    }
  });
});

// ROUTE: Unsave a particular article and all notes for article
app.post("/articles/delete/:id", (req, res) => {
  Article.findOneAndUpdate(
    { _id: req.params.id },
    { saved: false, notes: [] }
  ).exec((error, doc) => (error ? console.log(error) : res.send(doc)));
});

// ROUTE: Delete a note from the database
app.delete("/notes/delete/:note_id/:article_id", (req, res) => {
  Note.findOneAndRemove({ _id: req.params.note_id }, error => {
    if (error) {
      console.log(error);
      res.send(error);
    } else {
      Article.findOneAndUpdate(
        { _id: req.params.article_id },
        { $pull: { notes: req.params.note_id } }
      ).exec(error => (error ? res.send(error) : res.send("Note Gone!")));
    }
  });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
