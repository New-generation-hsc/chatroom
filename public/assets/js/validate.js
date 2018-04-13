
(function ($) {
    "use strict";

    $('#submit').click(()=> {
    	var nickname = $("#nickname").val();
    	var checkbox = $("#agree-check");

    	if(nickname.length === 0){
    		logerror('Empty nickname is Invalid');
    	}else if(!checkbox.is(':checked')){
    		logerror('Please check the agreement');
    	}
    });


    function logerror(msg){
    	$("#chat-title").html(msg);
		$('#chat-title').css('color', 'red');
		setTimeout(()=> {
			$("#chat-title").html('~/ChatRoom');
			$('#chat-title').css('color', '#766F79');
		}, 2000);
    }

})(jQuery);