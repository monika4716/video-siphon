jwtToken = null;
isStorageAvailable = null;
chrome.cookies.get({url: _config.baseUrl,name: "vs_jwt_token"}, function(result) {
	    if(result != null){
	       jwtToken = result.value;
	    }
	}); 

chrome.storage.local.get(['userData'], function(result) {
    if(result.userData != ""){
        isStorageAvailable = true;
    }
});


$(document).ready(function(){

	$('.profile_sec').click(function(){
		$('.tab').hide();
		$('#edit_profile').show();
	});

	if(jwtToken != null && isStorageAvailable){
		dashboard();
	}else{
		$("#login_screen").show();
	}

	setConfigUrls();

	$("#login_form").validate({
	  rules: {
	    license_key: "required"
	  },
	  messages: {
	    license_key: "License is required"
	  },
	  submitHandler: function(form) {
	    login();
	  }
	});

	$(".profile-menu").click(function(){
		profile();
	})

	$("#update_profile").validate({
	  rules: {
	    name: "required",
	    email: "required"
	  },
	  messages: {
	    name: "Name is required",
	    email: "Email is required"
	  },
	  submitHandler: function(form) {
	    updateProfile();
	  }
	});

	$(".go-back").click(function(){
		dashboard();
	})

	$(".signoutBtn").click(function(){
		logout();
	})

	$(".forgotPwd").click(function(){
		$(".tab").hide();
		$("#forgot_screen").show();
	})

	$(".haveLicense").click(function(){
		$(".tab").hide();
		$("#login_screen").show();
	})

	$("#forgotPwd_form").validate({
	  rules: {
	    email: {
	    	required:true,
	    	email:true
	    }
	  },
	  messages: {
	    email: {
	    	required:"Email is required",
	    	email:"Email is not valid"
	    }
	  },
	  submitHandler: function(form) {
	    forgotPassword();
	  }
	});
});

function login(){
	var submit_button = $("#login_form button[type='submit']");
	submit_button.attr('disabled',true).text('Loading...');

	$.ajax({
		url : _config.apiBaseUrl+'login',
		type : 'post',
		data: $("#login_form").serialize(),
   		dataType: 'json',
   		success: function(response){
  
   			submit_button.attr('disabled',false).text('Login');
   			if(response.status == 404){
   				displayMessage(response.msg,'danger')
   			}else{
   				$("#login_form")[0].reset();
   				jwtToken = response.apiToken;
   				chrome.cookies.set({ url: _config.baseUrl, name: "vs_jwt_token", value:  response.apiToken, expirationDate: (new Date().getTime()/1000)	 + (3600 * 1000*87660)  });
   				var userData = {'name':response.user.name,'email':response.user.email,'plan':response.planConfig.name,'upgrade_to':response.planConfig.upgrade_to,'unique_hash':response.user.unique_hash}
   				chrome.storage.local.set({'userData': userData});
   				setConfigUrls();
   				dashboard();
   			}
   		},
   		error: function(response){
   			apiError(response)
   		}
	});
}

function displayMessage(message, addClass, timer=3000) {
    $(".msg_box").text(message);
    $(".msg_box").addClass("mtb-10 alert alert-"+addClass);
    setTimeout(function() {
        $(".msg_box").removeClass("mtb-10 alert alert-danger alert-success");
        $(".msg_box").text('');
    }, timer);
}

function setConfigUrls(){
	chrome.storage.local.get(['userData'], function(result) {
	    var hash = result.userData.unique_hash;
	    $(".plans_link").attr('href',_config.plansUrl+hash);
	});
	$(".free_trial_link").attr('href',_config.free_trial);
	console.log(_config.affiliatesUrl);
	$(".affiliate_link").attr('href',_config.affiliatesUrl);
	$(".support_link").attr('href',_config.supportUrl);
}

function dashboard(){
	$('.tab').hide();
	$('#use_videosiphon').show();
	chrome.storage.local.get(['userData'], function(result) {
		nameArray = result.userData.name.split(" ");
		$(".user_name").text(nameArray[0]);
		$("#activeplan").text(result.userData.plan);
		if(result.userData.upgrade_to != null){
			$("#upgrade_to").text(result.userData.upgrade_to);
			$('.profile-menu').removeClass('order-2');
			$('.signoutBtn').removeClass('order-4');
			$('.become-affiliate').removeClass('order-3');
			$('.plans-upgrade').removeClass('order-3 col-2');
			$('.plans-upgrade').addClass('col-3');
			$('.footer-colum').removeClass('no-upgrade');

		}else{
			$("#upgrade_to_row").addClass('hidden');
			$('.profile-menu').addClass('order-2');
			$('.signoutBtn').addClass('order-4');
			$('.plans-upgrade').removeClass('col-3');
			$('.become-affiliate').addClass('order-3');
			$('.plans-upgrade').addClass('order-1 col-2');
			$('.footer-colum').addClass('no-upgrade');
		}
		
    });
}

function profile(){
	$('#dashboardScreen').hide();
	$('#ProfileScreen').show();
	chrome.storage.local.get(['userData'], function(result) {
  		$("#name").val(result.userData.name);
  		$(".edit-email").val(result.userData.email);
    });
}

function updateProfile(){
	var submit_button = $("#update_profile button[type='submit']");
	submit_button.attr('disabled',true).text('UPDATING...');

	$.ajax({
		url : _config.apiBaseUrl+'update-profile',
		type : 'post',
		data: $("#update_profile").serialize(),
   		dataType: 'json',
   		headers: { 'Authorization': 'Bearer '+jwtToken },
   		success: function(response){
   			submit_button.attr('disabled',false).text('UPDATE PROFILE');
   			if(response.status == 404){
   				displayMessage(response.msg,'danger')
   			}else{
   				displayMessage(response.msg,'success')
				chrome.storage.local.get(['userData'], function(result) {
					var userData = result.userData;
					userData.name = $('#update_profile input[name="name"]').val()
					userData.email = $('#update_profile input[name="email"]').val()
					chrome.storage.local.set({'userData': userData});					
				});
   			}
   		},
   		error: function(response){
   			apiError(response)
   		}
	});
}

function logout(){
	chrome.storage.local.set({'userData': ''});
	chrome.cookies.set({ url: _config.baseUrl, name: "vs_jwt_token", value:  null, expirationDate: (new Date().getTime()/1000) - (3600 * 1000*87660)  });
	$('.tab').hide();
	$('#login_screen').show();
	$(".msg_box").removeClass("mtb-10 alert alert-danger alert-success");
    $(".msg_box").text('');
    displayMessage('Logged Out Successfully.','success')
}

function forgotPassword(){
	var submit_button = $("#forgotPwd_form button[type='submit']");
	submit_button.attr('disabled',true).text('Loading...');

	$.ajax({
		url : _config.apiBaseUrl+'reset-password',
		type : 'post',
		data: $("#forgotPwd_form").serialize(),
   		dataType: 'json',
   		success: function(response){
   			submit_button.attr('disabled',false).text('Submit');
   			if(response.status == 404){
   				displayMessage(response.msg,'danger')
   			}else{
   				$("#forgotPwd_form")[0].reset();
   				displayMessage(response.msg,'success')
   			}
   		},
   		error: function(response){
   			apiError(response)
   		}
	});
}

function apiError(data){
	console.log(data);
}