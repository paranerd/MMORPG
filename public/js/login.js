$(window).resize(function(){
	$('#loginBox').css({
		position:'absolute',
		left: ($(window).width() - $('#loginBox').outerWidth())/2,
		top: ($(window).height() - $('#loginBox').outerHeight())/2
	});
	$('#idForm').css({
		position:'absolute',
		left: ($('#loginBox').width() - $('#idForm').outerWidth())/2,
		top: ($('#loginBox').height() - $('#idForm').outerHeight())/2
	});
});
$(window).resize();
