const wistiaRequestUrl = "https://fast.wistia.net/embed/iframe/";
const facebookRequestUrl = "https://www.facebook.com/watch/?v={videoID}";

window.onload = function () {
    injectDownloadButton();
}


setInterval(()=>{
    if(window.location.href.indexOf("facebook.com") > 0 || window.location.href.indexOf("vimeo.com") > 0 || window.location.href.indexOf("wistia.com") > 0){
        chrome.runtime.sendMessage({"type":"backgroundActivate","from":"content"})
    }
},2000);


function injectDownloadButton(){
    this.document.body.innerHTML.includes("iframeBlocker") ? processTheIframeBlockers(this) : null;
    (location.host === "vimeo.com") ? vimeoButtonInjector(this) : vimeoAlternativeButtonInjector(this);
    (window.location.href.indexOf("facebook.com") > 0) ? facebookButtonInjector() : wistiaButtonInjector();

    chrome.storage.local.get(['userData'], function(result) {
        if(result.userData != ""){
            $("body").append("<style class='videoSiphonBtn'>.__video-siphon__{display:block !important;}</style>"); 
        }
    }); 
}

const processTheIframeBlockers = () => {
    let iframeBlockers = document.getElementsByClassName("iframeBlocker")
    iframeBlockers.forEach((blocker) => {
        blocker.addEventListener("click", function () {
            this.parentNode.removeChild(this)
        })
    })
}

const wistiaButtonInjector = () => {
    document.addEventListener('mouseover', function(e){
        if(e.target.tagName === "DIV" && e.target.classList.contains("w-vulcan--background")){
            e.target.classList.add("tempClass")
            var wrapper = $('.tempClass').closest('.wistia_embed');
            if($(wrapper)[0] == undefined){
                var wrapper = $('.tempClass').closest('.w-ui-container').siblings('.w-video-wrapper');
                $(wrapper[0]).attr('id', 'vs_btn_wrap');
                var wrapper_id = 'vs_btn_wrap';
                var video_src = $(wrapper[0]).children().find('track')[0].src;
                video_src = video_src.replace('https://fast.wistia.net/embed/captions/','');
                video_id = video_src.split('.')[0];
            }else{
                var wrapper_id = $(wrapper)[0].id;
                var video_id = wrapper_id.replace('wistia-','');
                video_id = video_id.replace('-1','');
            }
            
            e.target.classList.remove("tempClass");
            $.ajax({
                url : wistiaRequestUrl+video_id,
                type : 'get',
                success: function(response){
                    
                    var search = '("assets":)(.*?)(}])';
                    var data  = response.match(search)
                    var json = data[0].replace('"assets":','');

                    json = JSON.parse(json);
                    addWistiaDownloadButton(document, wrapper_id , json);
                }
            });
        }
    });
}

function addWistiaDownloadButton(_document, wrapper_id , assets){

    if($("#"+wrapper_id).children().hasClass('__video-siphon__')){
        return;
    }

    let div = _document.createElement("div");
    div.setAttribute("class", "__video-siphon__");
    div.setAttribute("style", "position: absolute;right:0;top:0;z-index:9999999;display:none;");
       
    let btn = _document.createElement("button");
    btn.setAttribute("class", "__video-siphon-drop-btn__");
    btn.innerText = "VideoSiphon Download";
       
    div.appendChild(btn);


    let divContent = _document.createElement("div");
    divContent.setAttribute("class", "__video-siphon-content__");
    divContent.setAttribute("style", "right:0;");
    let added = [];

    for (i = 0; i < assets.length; i++) {
        if ((assets[i].ext == "mp4" || assets[i].ext == "m4v") && !added.includes(assets[i].display_name)) {
            var link = _document.createElement("a");
            let url = assets[i].url;
            url = url.replace(".bin", ".mp4");
            link.setAttribute("href", url);
            link.setAttribute("download", "");
            link.setAttribute("class", "download_link");
            link.setAttribute("target", "_blank");
            link.addEventListener('click', sendDownloadLink);
            link.addEventListener('contextmenu', sendDownloadLink);
            if(assets[i].ext != "mp4"){
                link.innerText = assets[i].display_name.toUpperCase();
            } else {
                link.innerText = assets[i].ext.toUpperCase() + " " + assets[i].display_name.toUpperCase();
            }
            divContent.appendChild(link);
            added.push(assets[i].display_name);
        }
    }

    div.appendChild(divContent); 
    $("#"+wrapper_id).append(div);
}

const vimeoButtonInjector = (_this) => {
    let vimeo_container = document.getElementsByClassName("player_container");
    if(vimeo_container){
        vimeo_container = vimeo_container[0];
        let args = vimeo_container.firstChild.getAttribute("data-config-url");
        if(args) {
            chrome.runtime.sendMessage({ from: "content",provider: "vimeo", args: args, vimeo_container:vimeo_container.id });
        }
    }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.from == "background" && request.subject == "verifyDownloadButton"){
        $(".player_container .__video-siphon__").remove();
        injectDownloadButton();
    } else if(request.from == "background" && request.response != ""){
        addVimeoDownloadButtonForVimeo(document, request.vimeo_container, request.response); 
    }
});

const vimeoAlternativeButtonInjector = (_this) => {
    if (_this.location.href.indexOf("player.vimeo.com/video/") > -1) {
        let content = _this.document.documentElement.innerHTML;
        let sources = extractVimeoObj(content);
        let player = _this.document.getElementById("player");
        addVimeoDownloadButton(_this, player.parentNode, sources);
    }
}

const facebookButtonInjector = () => {
	$('body').on('mouseover','.k4urcfbm.l9j0dhe7.datstx6m.a8c37x1j.du4w35lb',function(){
        console.log('mouseover');
		if(!($(this).children().hasClass('__video-siphon__'))) {
			var _this = document;
			div = _this.createElement('div'); 
			div.setAttribute("class", "__video-siphon__");
		    div.setAttribute("style", "position: absolute;top: 0;right: 0;z-index: 9999999;display:none;");

		    btn = _this.createElement('button'); 
		    btn.setAttribute("class", "__video-siphon-drop-btn__");
		    btn.innerText = "VideoSiphon Download";
		    

		    div_content = _this.createElement('div'); 
		    div_content.setAttribute("class", "__video-siphon-content__");
		    div_content.setAttribute("style", "right:0;");

		    div.appendChild(btn);
		    div.appendChild(div_content);

		    var video_id = getVideoId($(this));

		    
		 	if(!video_id){
		        return;
		    }
            $(this).append(div);
		    btn.addEventListener("click", function(ev){
		        if(div_content.childElementCount > 0){
		            return;
		        }
		        btn.innerText = "Please hold on...";
		        $('.lastClicked').removeClass('lastClicked');
		        btn.classList.add("lastClicked");
		        const url = facebookRequestUrl.replace("{videoID}", video_id);
		        CreateDownloadableLinks(url, _this, div_content, btn);
		    });
		}
	})
}

function getVideoId(_this){
	var video_id_string = _this.find('a.oajrlxb2.g5ia77u1.gcieejh5.bn081pho.humdl8nn.izx4hr6d.rq0escxv.nhd2j8a9.q9uorilb.p7hjln8o.qjjbsfad.fv0vnmcu.w0hvl6rk.ggphbty4.jb3vyjys.rz4wbd8a.qt6c0cv9.a8nywdso.i1ao9s8h.esuyzwwr.f1sip0of.lzcic4wl.l9j0dhe7.abiwlrkh.p8dawk7l.i2p6rm4e.jnigpg78.byekypgc').attr('href');
    if(video_id_string){
        if(video_id_string.indexOf('/videos/') > -1){
            return video_id_string.split('/videos/')[1].split('/')[0];
        }else if(video_id_string.indexOf('/watch/') > -1){
            return video_id_string.split('v=')[1].split('&')[0];
        }
	}

	if(window.location.href.indexOf("/videos/") > -1){
		currentURL = window.location.href;
		var lastChar = currentURL.slice(-1);
		if(lastChar != '/'){
			currentURL = currentURL+'/';
		}

        let search_term = '\/videos\/(.+?)\/';
        let match = currentURL.match(search_term);
        if(match != null){
            let video_id = match[1];
            return video_id;
        }
    }else if(window.location.href.indexOf("/watch/") > -1){
        currentURL = window.location.href;
        var lastChar = currentURL.slice(-1);
        if(lastChar != '/'){
            currentURL = currentURL+'/';
        }

        let search_term = '\/watch\/(.+?)\/';
        let match = currentURL.match(search_term);
        if(match != null){
            let video_id = match[1];
            return video_id;
        }
    }
    return null;
}

function CreateDownloadableLinks(url, _this, div_content, btn){
	chrome.runtime.sendMessage({'from':'content','subject':'getDownloadableLinks','url':url});
}

function sendDownloadLink(ev) {
    ev.preventDefault();
    chrome.runtime.sendMessage({'from':'content','subject':'downloadVideo','url':ev.target.href});
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
 	if(request.from === 'background' && request.subject === 'FindVideoUrlInSource'){
 		var sd_url = 'NaN';
 		var hd_url = 'NaN';
 		let videos = {};
 		let search_sd_term = '"playable_url":"(.+?)"';
		var sd_match = $('body').html().match(search_sd_term);
		if(sd_match != null){
			sd_url = sd_match[1];
			sd_url = sd_url.replace(/\\/g, '').replace("&amp", "&").replace("&;", "&");
		}

		let search_hd_term = '"playable_url_quality_hd":"(.+?)"';
		var hd_match = $('body').html().match(search_hd_term);
		if(hd_match != null){
			hd_url = hd_match[1];
			hd_url = hd_url.replace(/\\/g, '').replace("&amp", "&").replace("&;", "&");
		}

		videos['sd'] = sd_url;
		videos['hd'] = hd_url;
		sendResponse(videos);
 	}
 	else if(request.from === 'background' && request.subject === 'downloadableLinks'){
 		if(request.data.sd != 'NaN'){
 			let sd_a = document.createElement('a');
            sd_a.setAttribute("href", request.data.sd);
            sd_a.setAttribute("target", "_blank");
            sd_a.setAttribute("title", "Download");
            sd_a.innerText = "MP4 SD";
            sd_a.addEventListener('click', sendDownloadLink);
            sd_a.addEventListener('contextmenu', sendDownloadLink);

            $('.lastClicked').parent().find('.__video-siphon-content__').append(sd_a);
 		}
 		$('.lastClicked').text('VideoSiphon Download');
 		$('.lastClicked').removeClass('lastClicked')
 	}

 });

chrome.storage.onChanged.addListener(function(changes, namespace) {
    var storageChange = changes['userData'];
    var userData = storageChange.newValue;
    if(userData == ""){
        $(".videoSiphonBtn").remove();
    }else{
        $("body").append("<style class='videoSiphonBtn'>.__video-siphon__{display:block !important;}</style>");
    }
}); 

function addVimeoDownloadButton(_this, before_element, vimeoJSON) {
    var _this = document;
    div = _this.createElement('div'); 
    div.setAttribute("class", "__video-siphon__");
    // div.setAttribute("style", "float:right; z-index: 999999999999999; margin-right: 20px;");
    div.setAttribute("style", "float:right; z-index: 100;display:none;");

    let btn = _this.createElement("button");
    let span1 = _this.createElement("span");
    let span2 = _this.createElement("span");
    btn.setAttribute("class", "__video-siphon-drop-btn__");
    span1.innerText = "VideoSiphon";
    span1.setAttribute("style", "background-color: black; padding: 9px; margin-left: -15px; cursor: initial")
    span2.innerText = "Download New";
    span2.setAttribute("style", "padding: 9px;")
    btn.appendChild(span1);
    btn.appendChild(span2);
    div.appendChild(btn);
    let div_content = _this.createElement("div");
    div_content.setAttribute("class", "__video-siphon-content__");
    div_content.setAttribute("style", "right:0;");

    var vimeoDownloadArray = vimeoJSON.request.files.progressive;
    vimeoDownloadArray.sort(compareVimeoDownload).reverse();
    vimeoDownloadArray.forEach(function (e) {
        let url = e.url;
        if(url.includes('?'))
            url = url.substring(0, url.indexOf('?'));
        var element = _this.createElement('a');
        element.innerHTML = "<a download href='" + url + "' target='_blank' title='Download " + e.quality + " with " + e.fps + "fps'>MP4 " + e.quality + "</a>";
        element.addEventListener('click', sendDownloadLink);
        element.addEventListener('contextmenu', sendDownloadLink);
        div_content.appendChild(element);
    });
    div.appendChild(div_content);
    before_element.insertBefore(div, before_element.firstChild);
}

function addVimeoDownloadButtonForVimeo(_this, before_element, vimeoJSON) {
    var vimeoJSON = JSON.parse(vimeoJSON);
    if($(".player_container div").children().hasClass('__video-siphon__')){
        return;
    }
    var _this = document;
    div = _this.createElement('div'); 
    div.setAttribute("class", "__video-siphon__");
    div.setAttribute("style", "float:right; z-index: 100;top:170px;display:none;");

    let btn = _this.createElement("button");
    let span1 = _this.createElement("span");
    let span2 = _this.createElement("span");
    btn.setAttribute("class", "__video-siphon-drop-btn__");
    btn.setAttribute("style", "height: 34px;font-size: 14px;");
    
    span1.innerText = "VideoSiphon";
    span1.setAttribute("style", "background-color: black; padding: 9px; margin-left: -15px; cursor: initial")
    span2.innerText = "Download New";
    span2.setAttribute("style", "padding: 9px;")
    btn.appendChild(span1);
    btn.appendChild(span2);
    div.appendChild(btn);
    let div_content = _this.createElement("div");
    div_content.setAttribute("class", "__video-siphon-content__");
    div_content.setAttribute("style", "right:0;");
    var vimeoDownloadArray = vimeoJSON.request.files.progressive;
    vimeoDownloadArray.sort(compareVimeoDownload).reverse();
    vimeoDownloadArray.forEach(function (e) {
        let url = e.url;
        if(url.includes('?'))
            url = url.substring(0, url.indexOf('?'));
        var element = _this.createElement('a');
        element.innerHTML = "<a download href='" + url + "' target='_blank' title='Download " + e.quality + " with " + e.fps + "fps'>MP4 " + e.quality + "</a>";
        element.addEventListener('click', sendDownloadLink);
        element.addEventListener('contextmenu', sendDownloadLink);
        div_content.appendChild(element);
    });
    div.appendChild(div_content);
    $("#"+before_element+" .js-player").append(div)
}
function extractVimeoObj(html) {
    let content = html;
    let search_for = "var config = {";
    let index_of_json = content.indexOf(search_for) + search_for.length - 1;
    content = content.substring(index_of_json);
    content = content.substring(0, content.indexOf("};") + 1);
    return JSON.parse(content);
}

function compareVimeoDownload(a, b) {
    let aquality = parseInt(a.quality);
    let afps = a.fps;
    let bquality = parseInt(b.quality);
    let bfps = b.fps;
    if (aquality === bquality) {
        if (afps === bfps) {
            return 0;
        } else if (afps < bfps) {
            return -1;
        } else {
            return 1;
        }
    } else if (aquality < bquality) {
        return -1;
    } else {
        return 1;
    }
}