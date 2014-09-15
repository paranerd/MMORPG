$(document).ready(function() {
	$('#thebutton').click(function() {
		$('#logcontainer').slideToggle();
	});

	$("#thebutton").toggle(function(){
		this.src = "sprites/message_log_up.png";
	}, function() {
		this.src = "sprites/message_log_down.png";
	});
});
