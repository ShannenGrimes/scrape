
$(function() {
    $("body").on("click", ".save-btn", function() {
        event.preventDefault();
        var articleId = $(this).attr("data-articleId");
        var saved = ($(this).attr("data-saved"));
        console.log(saved);
        var queryUrl = "/article/" + articleId;
        $.ajax({
            url: queryUrl,
            method: "PUT",
            data: {
                saved: saved
            }
        }).then(function(response) {
            location.reload();
        });


    });

    $("#scrape-btn").on("click", function() {
        event.preventDefault();
        $("#scrape-btn").text("Scraping has started...");
        $("#scrape-btn").removeClass("btn-outline-info");
        $("#scrape-btn").addClass("btn-outline-warning disabled");
        $.ajax({
            url: "/scrape",
            method: "GET"
        }).then(function() {
            $("#scrape-btn").text("Complete");
            $("#scrape-btn").removeClass("btn-outline-warning");
            $("#scrape-btn").addClass("btn-outline-success");
            setTimeout(function() {
                location.reload();
            }, 500);
        });
    });

    $("#view-saved-btn").on("click", function() {
        $.ajax({
            url: "/articles/saved",
            method: "GET"
        }).then(function(data) {
            console.log("done");
        });
    });

    $("body").on("click", ".view-summary", function() {
        $(this).css("display", "none");
        var summaryId = $(this).attr("data-summaryId");
        var $summary = "#" + summaryId;
        $($summary).css("display", "block");
    });

    $("body").on("click", ".add-btn", function() {
        event.preventDefault();
        var id = $(this).attr("data-articleId");
        var titleId = $(this).attr("data-title");
        var bodyId = $(this).attr("data-body");

        var title = $(titleId).val().trim();
        var body = $(bodyId).val().trim();

        console.log("id:" + id);
        console.log("titleId" + titleId);
        console.log("bodyId" + bodyId);
        console.log("title" + title);
        console.log("body" + body);

        $.ajax({
            url: "/articles/notes/" + id,
            method: "POST",
            data: {
                title,
                body
            }
        }).then(function(edited) {
            console.log(edited);
            location.reload();
        });
    });

    $("body").on("click", ".notes-btn", function() {
        var $notesDiv = $(this).attr("data-notesDiv");
        var articleId = $(this).attr("data-articleId");
        $($notesDiv).css("display", "block");

        $("body").on("click", ".deleteNote-btn", function() {
            event.preventDefault();
            var noteId = $(this).attr("data-noteId");
            var nId = noteId.slice(7);
    
            $.ajax({
                url: "/article/notes/" + articleId,
                method: "PUT",
                data: {
                    noteId: nId
                }
            }).then(function() {
                location.reload();
            });
        });
    });

    $("body").on("click", ".closeNotes-btn", function() {
        var $notesDiv = $(this).attr("data-notesDiv");
        $($notesDiv).css("display", "none");
    });
});