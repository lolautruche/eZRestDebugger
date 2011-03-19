function RequestHandler() 
{
  this._init();
}

RequestHandler.prototype = {
  
  authType: null,
  
  _init: function() 
  {
  },
  
  send: function() 
  {
    $('#resp, #loader').fadeIn();
    var requestParams = {
      url: $('#restEndpointServer').val() + $('#restEndpointURI').val(),
      type: $('input[name="method"]:checked').val(),
      error: this.error,
      success: this.success
    };
    
    $.ajaxSetup(requestParams);
  },
  
  success: function(data, textStatus, jqXHR ) 
  {
    $('#loader').fadeOut();
    $('#responseHeaders').val(jqXHR.getAllResponseHeaders());
    $('#responseStatus').text(jqXHR.status);
    var responseText = beautify.js(jqXHR.responseText.replace());
    $('#responseBody').text(responseText);
    prettyPrint();
    if(!$('#responsePrint').is(':visible'))
      $('#responsePrint').fadeIn();
  },
  
  error: function(jqXHR, textStatus, errorThrown) 
  {
    $('#loader').fadeOut();
    $('#responseHeaders').val(jqXHR.getAllResponseHeaders());
    $('#responseStatus').text(jqXHR.status);
    var responseText = beautify.js(jqXHR.responseText.replace());
    $('#responseBody').text(responseText);
    prettyPrint();
    if(!$('#responsePrint').is(':visible'))
      $('#responsePrint').fadeIn();
  }
};

// =====================================

function OAuth2RequestHandler() {
  RequestHandler.call(this); // Call parent constructor
}

OAuth2RequestHandler.prototype = new RequestHandler();
OAuth2RequestHandler.constructor = OAuth2RequestHandler;
OAuth2RequestHandler.prototype.parent = RequestHandler.prototype;

// OAuth2 properties
OAuth2RequestHandler.prototype.authType = REST_AUTHTYPE_OAUTH2;
OAuth2RequestHandler.prototype.accessToken = null;
OAuth2RequestHandler.prototype.refreshToken = null;
OAuth2RequestHandler.prototype.clientId = null;
OAuth2RequestHandler.prototype.clientSecret = null;

OAuth2RequestHandler.prototype.send = function() {
  this.parent.send.call(this);
  var clientId = $('#oauth2ClientId').val();
  var clientSecret = $('#oauth2ClientSecret').val();
  var clientEndpoint = $('#oauth2ClientEndpoint').val();
  var accessToken = $('#oauth2AccessToken').val();
  var refreshToken = $('#oauth2RefreshToken').val();
  var inst = this;
  
  if(accessToken) 
  {
    $.ajax({
      headers: {
        'Authorization': 'OAuth ' + accessToken
      },
      success: function(data, textStatus, jqXHR) {
        OAuth2RequestHandler.Static.tries = 0;
        inst.parent.success.call(inst, data, textStatus, jqXHR);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if(OAuth2RequestHandler.Static.tries > 0)
        {
          alert('Authorization problem, most likely forbidden content');
          return false;
        }
        
        switch(jqXHR.status)
        {
          case HTTP_UNAUTHORIZED: // 401
            if (jqXHR.status == HTTP_UNAUTHORIZED && refreshToken) 
            {
              OAuth2RequestHandler.Static.tries++;
              // Make a new request to refresh the access token
              var postData = {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret
              };
              
              $.ajax({
                url: $('#restEndpointServer').val() + OAUTH2_REFRESH_TOKEN_URI,
                type: 'post',
                data: postData,
                success: function(data, textStatus, jqXHR) {
                  $('#oauth2AccessToken').val(data.access_token);
                  $('#oauth2RefreshToken').val(data.refresh_token);
                  if (rest.remember) 
                  {
                    rest.storage.setValue('oauth2AccessToken', data.access_token);
                    rest.storage.setValue('oauth2RefreshToken', data.refresh_token);
                  }
                  
                  // Relaunch first request
                  inst.send();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                  inst.parent.error.call(inst, jqXHR, textStatus, errorThrown);
                  trace(jqXHR.responseText);
                  alert('Unable to refresh your access token. Reason is :\n'+jqXHR.responseText);
                }
              });
            }
            else
            {
              inst.parent.error.call(inst, jqXHR, textStatus, errorThrown);
              alert('An error occurred with your request. Your access token might be expired.\nPlease provide your refresh token to regenerate a new access token.');
            }
            break;
            
          default:
            OAuth2RequestHandler.Static.tries = 0;
            inst.parent.error.call(inst, jqXHR, textStatus, errorThrown);
            break;
        }
      }
    });
  }
  else
  {
    // Handle authentication
    var url = $('#restEndpointServer').val() + OAUTH2_AUTHORIZE_URI + '?redirect_uri='+encodeURIComponent(clientEndpoint)+'&client_id='+encodeURIComponent(clientId)+'&response_type=code';
    var options = new air.NativeWindowInitOptions(); 
    //options.systemChrome = "standard"; 
    options.type = "utility"; 
     
    var windowBounds = new air.Rectangle(200, 250, 600, 450); 
    var newHTMLLoader = air.HTMLLoader.createRootWindow(true, options, true, windowBounds);
    var nativeWindow = newHTMLLoader.window.nativeWindow;
    
    // Listening window closing event
    nativeWindow.addEventListener(air.Event.CLOSING, function(evt) {
      $('#loader').hide();
    });
    
    // Listening window location change event
    newHTMLLoader.addEventListener('locationChange', function(evt) {
      var currentLocation = evt.target.location;
      if(currentLocation.indexOf('error') != -1) 
      {
        nativeWindow.close();
        alert('An error has occurred during authentication.\nReturned query string : '+currentLocation.split('?')[1]);
        return false;
      }
      else if (currentLocation.indexOf('expires_in') != -1) // We're expecting OAuth authorization code to be in the URL, with expires_in param 
      {
        var aQueryString = currentLocation.split('?')[1].split('&');
        var oauthParams = {};
        aQueryString.forEach(function(val){
          var aCurrentParam = val.split('=');
          oauthParams[aCurrentParam[0]] = aCurrentParam[1];
        });
        
        inst.getAccessTokenFromAuthCode(oauthParams.code);
        nativeWindow.close();
      }
      
    });
    newHTMLLoader.load(new air.URLRequest(url));
  }
};

OAuth2RequestHandler.prototype.getAccessTokenFromAuthCode = function(authCode) {
  var clientId = $('#oauth2ClientId').val();
  var clientSecret = $('#oauth2ClientSecret').val();
  var clientEndpoint = $('#oauth2ClientEndpoint').val();
  var inst = this;
  
  var postData = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: clientEndpoint,
    code: authCode
  };
  
  $.ajax({
    url: $('#restEndpointServer').val() + OAUTH2_REFRESH_TOKEN_URI,
    type: 'post',
    data: postData,
    success: function(data, textStatus, jqXHR) {
      $('#oauth2AccessToken').val(data.access_token);
      $('#oauth2RefreshToken').val(data.refresh_token);
      if (rest.remember) 
      {
        rest.storage.setValue('oauth2AccessToken', data.access_token);
        rest.storage.setValue('oauth2RefreshToken', data.refresh_token);
      }
      
      // Relaunch first request
      inst.send();
    },
    error: function(jqXHR, textStatus, errorThrown) {
      inst.parent.error.call(inst, jqXHR, textStatus, errorThrown);
      trace(jqXHR.responseText);
      alert('Unable to get access token from code. Reason is :\n'+jqXHR.responseText);
    }
  });
};

OAuth2RequestHandler.prototype.success = function(data, textStatus, jqXHR ) { 
  $('#loader').fadeOut();
  $('#responseHeaders').val(jqXHR.getAllResponseHeaders());
  $('#responseBody').val(jqXHR.responseText);
  if(!$('#responsePrint').is(':visible'))
      $('#responsePrint').fadeIn();
};

// Static
OAuth2RequestHandler.Static = {
  /**
   * Number of tries for authentication
   */
  tries: 0
};

// =====================================

function BasicAuthRequestHandler() {
  RequestHandler.call(this); // Call parent constructor
}

BasicAuthRequestHandler.prototype = new RequestHandler();
BasicAuthRequestHandler.constructor = BasicAuthRequestHandler;
BasicAuthRequestHandler.prototype.parent = RequestHandler.prototype;

// Properties
BasicAuthRequestHandler.prototype.authType = REST_AUTHTYPE_BASIC;

BasicAuthRequestHandler.prototype.send = function() 
{
  this.parent.send.call(this);
};

BasicAuthRequestHandler.prototype.error = function() 
{
  this.parent.error.call(this);
}
