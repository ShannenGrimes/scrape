const mongoose = require("mongoose");

// Save a reference to the Schema constructor
const Schema = mongoose.Schema;

// Using the Schema constructor, create a new ArticleSchema object
// This is similar to a Sequelize model
const ArticleSchema = new Schema({
  // `title` must be of type String
  title: {
      type: String,
      trim: true,
      required: "Entry must have article title."
  },
  // `subheading` must be of type String
  subheading: {
      type: String,
      trim: true,
      required: "Entry must have article subheading."
  },
  // `link` must be of type String
  link: {
      type: String,
      trim: true,
      required: "Entry must have URL."
  },
  // `saved` must be of type Boolean
  saved: {
      type: Boolean
  }
});

// This creates our model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
