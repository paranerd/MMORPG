$(window).resize(function(){
	$("#login").css('left', ((window.innerWidth - $("#login").width() - 64) / 2) + "px");
});
$(window).resize();

function login() {
	sessionStorage.playerName = user.value;
	window.location = 'index.html';
}