$(function(){
	var content = window.opener.$(".navigable-pane.active").clone()
        .find(".hidden-print").remove().end().addClass("print-content");
        $(".print-title").after(content.prop("outerHTML"));
    document.title = content.find(".panel-title").text() + "--" + document.title;
});