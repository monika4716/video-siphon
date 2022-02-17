importScripts('../../config.js');

const wistiaRequestUrl = "https://fast.wistia.net/embed/iframe/";
const vimeoRequestUrl = "https://player.vimeo.com/video/{id}/config";
const facebookRequestUrl = "https://www.facebook.com/watch/?v={id}";


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
   if(changeInfo.status == "complete"){
        if(tab.url.indexOf('vimeo.com') > -1){ 
            chrome.tabs.sendMessage(tabId,{from: 'background', subject: 'verifyDownloadButton'});
        }        
   }
}); 
 

var activityTabId = 0;

function fetchDownloadableLinks(activityUrl){
    isPreMessagingProcessing = false;
    chrome.windows.create({
        url: activityUrl,
        focused:false,
        type:"popup",
        width:5,
        height:5,
        left:0,
        top:0
    },function (tabs) {
        activityTabId = tabs.tabs[0].id;
        chrome.tabs.onUpdated.addListener(activityTabListener);
    });
}

function activityTabListener(tabId, changeInfo, tab){
    if (changeInfo.status === "complete" && tabId === activityTabId) {
        chrome.tabs.sendMessage(activityTabId,{from: 'background', subject: 'FindVideoUrlInSource'},function(response){
            //console.log(response);
            //close the open download link window.
            chrome.tabs.remove(activityTabId)
            chrome.tabs.sendMessage(parentTabId,{from: 'background', subject: 'downloadableLinks', data: response});
        });
        chrome.tabs.onUpdated.removeListener(activityTabListener);
    }
}


var parentTabId = 0;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.from === 'content' && request.subject === 'getDownloadableLinks'){
        parentTabId = sender.tab.id;
        fetchDownloadableLinks(request.url);
    }

    if(request.from === 'content' && request.subject === 'downloadVideo'){
        //console.log(request.url);
        var getUrl = request.url
        chrome.downloads.download({
            url: getUrl
        })
        .then(response => console.log(response))
        .catch(error => console.log(error));
    }

    if(request.from === 'content' && request.provider === 'vimeo'){
        var arg = request.args;
        let reqUrl = arg;
        fetch(reqUrl).then(response => response.text()).then(data => {
            //console.log(data)
            var response = data;
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {from: "background","response":response, 'vimeo_container':request.vimeo_container});
            });
        })
    }
    if(request.from == "content" && request.type == "backgroundActivate"){
        console.log(request.type);
    }
 });

function reloadAllTabsOnStartUp() {
    chrome.windows.getAll({ populate: true }, function(windows) {
        windows.forEach(function(window) {
            //console.log(window.type);
            if (window.type == "normal") {
                window.tabs.forEach(function(tab) {
                    //collect all of the urls here, I will just log them instead
                    //console.log(tab.url);
                    if (tab.url && (tab.url.indexOf('facebook') != -1 || tab.url.indexOf('/groups/') != -1 )) {
                        chrome.tabs.reload(tab.id);
                    }
                });
            }
        });
    });
}

chrome.runtime.onInstalled.addListener(function() {
    reloadAllTabsOnStartUp();
}); 

chrome.runtime.onStartup.addListener(function() {
    reloadAllTabsOnStartUp();
    get_subscriber_data();
});

chrome.runtime.setUninstallURL(_config.baseUrl, function(){
    // chrome.storage.local.set({'userData': ''});
    // chrome.cookies.set({ url: _config.baseUrl, name: "vs_jwt_token", value:  null, expirationDate: (new Date().getTime()/1000) - (3600 * 1000*87660)  });
})

function get_subscriber_data(){
    chrome.cookies.get({url: _config.baseUrl,name: "vs_jwt_token"}, function(result) {
        if(result != null){
           token = result.value;

           fetch( _config.apiBaseUrl + "get-subscriber-data", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': "Bearer "+token
                }
            }).then(response => { return response.text(); 
            }).then(getresult => {
                let response = JSON.parse(getresult)
                //console.log(response); 
                if (response.status == 200) { 
                    var userData = {'name':response.user.name,'email':response.user.email,'plan':response.planConfig.name,'upgrade_to':response.planConfig.upgrade_to,'unique_hash':response.user.unique_hash}
                    chrome.storage.local.set({'userData': userData}); 
                }else{
                    chrome.storage.local.set({'userData': ''});
                }
            });
        }else{
            chrome.storage.local.set({'userData': ''});
        }
    }); 
}

setInterval(function(){
    console.log('get subscriber data')
    get_subscriber_data();
}, 60000);  




