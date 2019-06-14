
// require(["jquery", "jquery-ui"], function ($, jquery_ui) {
$(function(){
	$('.sidebar-left .slide-submenu').on('click', function(event) {
		event.stopPropagation();
		$(this).closest('.sidebar-body').hide("slide", { direction: "left" }, 500, function() {
			$('.mini-submenu-left').fadeIn();
		});
	});

	$('.mini-submenu-left').on('click', function() {
		$(this).hide();
		$('.sidebar-left .sidebar-body').show("slide", { direction: "left" }, 500);
	});

	$('.sidebar-right .slide-submenu').on('click', function(event) {
		event.stopPropagation();
		$(this).closest('.sidebar-body').hide("slide", { direction: "right" }, 500, function() {
			$('.mini-submenu-right').fadeIn();
		});
	});

	$('.mini-submenu-right').on('click', function() {
		$(this).hide();
		$('.sidebar-right .sidebar-body').show("slide", { direction: "right" }, 500);
	});

	$('.panel-heading').on('click', function() { 
		$(this).closest('.panel').find('.panel-body').toggle('collapse'); 
	});

	$(".sidebar-left .sidebar-body").show();
	$(".sidebar-right .sidebar-body").show();
	$('.mini-submenu-left').hide();
	$('.mini-submenu-right').hide();
});
// })