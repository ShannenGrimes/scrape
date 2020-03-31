$(document).ready(function() {
  $(document).on("click", ".scrape-new", scrapeArticle);
  $(document).on("click", ".clear", clearArticle);
  $(document).on("click", ".clear-saved", clearSavedArticle);
  $(document).on("click", ".save", saveArticle);
  $(document).on("click", ".delete", deleteSavedArticle);
  $(document).on("click", ".notes", addNotesToArticle);
  $(document).on("click", ".note-save", saveNote);
  $(document).on("click", ".note-delete", deleteNote);

  // Allows the user to view an article
  function scrapeArticle() {
    $(".article-container").prepend('<div class="loader"></div>');
    $.get("/api/fetch").then(function(data) {
      console.log(data);
      setTimeout(function() {
        window.location.href = "/";
      }, 2000);
    });
  }

  //Deletes unsaved article
  function clearArticle() {
    $.get("/api/clear").then(function(data) {
      console.log(data);
      $(".articleContainer").empty();
      location.reload();
    });
  }

  //Deletes saved article
  function clearSavedArticle() {
    $.get("/api/clear/saved").then(function(data) {
      console.log(data);
      $(".articleContainer").empty();
      location.reload();
    });
  }

  //Saves the article
  function saveArticle() {
    // get ID od the article to save
    var articleID = $(this)
      .parents(".card")
      .data();

    // removes articles
    $(this)
      .parents(".card")
      .remove();

    // Adds comments to the database
    $.ajax({
      method: "PUT",
      url: "/api/save/" + articleID._id
    }).then(function(data) {
      console.log(data);
    });
  }

  //Deletes saved article
  function deleteSavedArticle() {
    // get ID od the article to save
    var articleID = $(this)
      .parents(".card")
      .data();

    // removes article from saved page.
    $(this)
      .parents(".card")
      .remove();

    $.get("/api/deleteSaved/" + articleID._id);
  }

  //This is a modal for comments
  function addNotesToArticle() {
    var articleID = $(this)
      .parents(".card")
      .data();

    $.get("/api/notes/" + articleID._id).then(function(data) {
      console.log(data);
      var modalText = $("<div class='container-fluid text-center'>").append(
        $("<h4>").text("Notes For Article: " + articleID._id),
        $("<hr>"),
        $("<ul class='list-group note-container'>"),
        $("<textarea placeholder='New Note' rows='4' cols='50'>"),
        $("<button class='btn btn-success note-save'>Save Note</button>")
      );
      console.log(modalText);
      // Adding the formatted HTML to the note modal
      bootbox.dialog({
        message: modalText,
        closeButton: true
      });
      var noteData = {
        _id: articleID._id,
        notes: data || []
      };
      console.log("noteData:" + JSON.stringify(noteData));
      //Pulling article ID to be accessible in the save notes method
      $(".note-save").data("article", noteData);
      // Renders notes
      getAllNotes(noteData);
    });
  }

  // This function called when user click on X to delete a note
  function deleteNote() {
    // First we grab the id of the note we want to delete
    // We stored this data on the delete button when we created it
    var noteID = $(this).data("_id");
    // AJAX request to server to delete note
    $.ajax({
      url: "/api/notes/" + noteID,
      method: "DELETE"
    }).then(function() {
      // When done, hide the modal
      bootbox.hideAll();
    });
  }

  //Function called when user clicks save button on the modal
  function saveNote() {
    var noteData;
    var newNote = $(".bootbox-body textarea")
      .val()
      .trim();
    console.log(newNote);
    if (newNote) {
      noteData = {
        _headlineId: $(this).data("article")._id,
        noteText: newNote
      };
      console.log(noteData);
      $.post("/api/notes", noteData).then(function() {
        // When complete, close the modal
        bootbox.hideAll();
      });
    }
  }

  //Display all notes related to article
  function getAllNotes(data) {
    var notesToRender = [];
    var currentNote;
    if (!data.notes.length) {
      // If we have no notes, just display a message explaining this
      currentNote = $(
        "<li class='list-group-item'>No notes for this article yet.</li>"
      );
      notesToRender.push(currentNote);
    } else {
      // If we do have notes, go through each one
      for (var i = 0; i < data.notes.length; i++) {
        // Constructs an li element to contain our noteText and a delete button
        currentNote = $("<li class='list-group-item note'>")
          .text(data.notes[i].noteText)
          .append($("<button class='btn btn-danger note-delete'>x</button>"));
        // Store the note id on the delete button for easy access when trying to delete
        currentNote.children("button").data("_id", data.notes[i]._id);
        // Adding our currentNote to the notesToRender array
        notesToRender.push(currentNote);
      }
    }
    // Now append the notesToRender to the note-container inside the note modal
    $(".note-container").append(notesToRender);
  }
});
