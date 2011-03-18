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
                  alert('Unable to refresh to access token. Reason is :\n'+jqXHR.responseText);
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
  }
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
