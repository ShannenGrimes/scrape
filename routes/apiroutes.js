var mongoose = require("mongoose");
var db = require("../models");
var axios = require("axios");
var cheerio = require("cheerio");
var data = {};

module.exports = app => {
  // Main
  app.get("/", function(req, res) {
    res.render("enter", {
      title: "Enter Now!"
    });
  });
  //articles created in the database
  app.get("/scrape", function(req, res) {
    axios
      .get("https://www.npr.org/sections/news/")
      .then(function(response) {
        var $ = cheerio.load(response.data);
        var blanks = 0;
        $("article").each(function(i, element) {
          var headLine = $(element)
            .children(".item-info")
            .children(".title")
            .children("a")
            .text();
          var link = $(element)
          .children(".item-info")
          .children(".title")
          .children("a")
            .attr("href");

          var summary = $(element)
          .children(".item-info")
          .children(".teaser")
          .children("a")
          .text();

          var article = { headLine, summary, link };
          console.log(article)

          //if this article hasn't already been scraped then add to database
          db.Article.find({})
            .then(function(data) {
              for (var i = 0; i < data.length; i++) {
                if (data[i].headLine !== headLine) {
                  blanks++;
                }
              }
              console.log(blanks);
              console.log(data.length);
              if (blanks === data.length) {
                db.Article.create(article)
                  .then(function(dbArticle) {
                    console.log(dbArticle);
                  })
                  .catch(function(err) {
                    console.log(err);
                  });
                blanks = 0;
              } else {
                blanks = 0;
              }
            })
            .catch(function(err) {
              return res.end(err);
            });
        });
        res.json({ message: "Scrape Complete" });
      });
  });

  //get saved articles and display
  app.get("/articles/saved/", function(req, res) {
    db.Article.find({ saved: true })
      .sort({ created: -1 })
      .limit(30)
      .populate("note")
      .then(function(dbFound) {
        res.render("saved", {
          title: "Scraped News - Saved",
          dbFound: dbFound
        });
      })
      .catch(function(error) {
        if (error) {
          console.log(error);
        }
      });
  });

  //get articles and display
  app.get("/articles/:id?", function(req, res) {
    var id = req.params.id;
    if (id) {
      db.Article.findOne({ _id: id })
        .populate("note")
        .then(function(dbFound) {
          res.json(dbFound);
        })
        .catch(function(error) {
          console.log(error);
        });
    } else {
      db.Article.find({})
        .sort({ created: -1 })
        .limit(30)
        .populate("note")
        .then(function(dbFound) {
          res.render("home", {
            title: "Scraped NPR Political Articles",
            dbFound: dbFound
          });
        })
        .catch(function(error) {
          if (error) {
            console.log(error);
          }
        });
    }
  });

  //add notes to articles
  app.post("/articles/notes/:id", function(req, res) {
    var id = req.params.id;
    db.Note.create({ title: req.body.title, body: req.body.body })
      .then(function(dbNote) {
        var noteId = dbNote._id;
        db.Article.findOneAndUpdate({ _id: id }, { $push: { note: noteId } })
          .then(function(edited) {
            res.json({ message: edited });
          })
          .catch(function(error) {
            res.end(error);
          });
      })
      .catch(function(err) {
        console.log(err);
        res.end(err);
      });
  });

  //add or remove an article from your saved articles
  app.put("/article/:id", function(req, res) {
    var id = req.params.id;
    db.Article.findOneAndUpdate(
      { _id: id },
      { $set: { saved: req.body.saved } }
    )
      .then(function(edited) {
        res.json(edited);
      })
      .catch(function(error) {
        res.end(error);
      });
  });

  //Delete a note from an article, note still available in database
  app.put("/article/notes/:id", function(req, res) {
    var id = req.params.id;
    db.Article.findOneAndUpdate(
      { _id: id },
      { $pull: { note: req.body.noteId } }
    )
      .then(function(edited) {
        res.json(edited);
      })
      .catch(function(error) {
        res.end(error);
      });
  });
};
