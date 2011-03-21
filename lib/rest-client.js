function RestClient() 
{
  this._initInternal();
}

RestClient.prototype = 
{
  isAir: false,
  remember: false,
  storage: null,
  requestHandler: null,
  
  /**
   * Init method, to be called just after the constructor, when DOM is ready
   */
  init: function() 
  {
    // Init remember settings
    var rememberSettings = this.storage.getValue('remember');
    if(rememberSettings === true) 
    {
      $('#rememberSettings').setAttr('checked', 'checked');
    }
    
    if ($('#rememberSettings').is(':checked')) 
    {
      this.setRememberSettings(true);
    }
    
    // If remember is activated, restore settings
    if (this.remember) 
    {
      this.restoreSettings();
    }    
  },
  
  /**
   * Internal initialization
   * @private
   */
  _initInternal: function() 
  {
    if(typeof(window.runtime) != 'undefined')
      this.isAir = true;
    
    this.storage = this._getStorageHandler();
    
    if(this.storage.getValue('remember') === true)
      this.remember = true;
      
  },
  
  /**
   * App settings restoration
   */
  restoreSettings: function() 
  {
    // Request settings
    var restEndpointServer = this.storage.getValue('restEndpointServer');
    $('#restEndpointServer').val(restEndpointServer);
    var restEndpointURI = this.storage.getValue('restEndpointURI');
    $('#restEndpointURI').val(restEndpointURI);
    var restMethod = this.storage.getValue('restMethod');
    if (restMethod) 
    {
      $('input[name="method"]').removeAttr('checked');
      $('input[name="method"][value="' + restMethod + '"]').attr('checked', 'checked');
      if(restMethod === 'post')
        $('#postParamsContainer').show();
    }
    
    // POST vars
    var postParams = this.storage.getValue('postParams')
    $('#postParams').val(postParams);
    
    // Auth settings
    var authType = this.storage.getValue('authType');
    if (authType) 
    {
      $('#authenticationTypeSelection').val(authType);
      this.restoreAuthSettings(authType);
      $('#' + authType).show();
    }
  },
  
  /**
   * Store all the App settings
   */
  storeSettings: function() 
  {
    var inst = this;
    $('input.inputText').each(function() {
      inst.storage.setValue($(this).attr('id'), $(this).val());
    });
    this.storage.setValue('authType', $('#authenticationTypeSelection').val());
    this.storage.setValue('restMethod', $('input[name="method"]:checked').val());
    this.storage.setValue('postParams', $('#postParams').val());
  },
  
  /**
   * Sets the "remember" setting
   * If set to false, will completely reset the local storage
   * @param {Boolean} val
   */
  setRememberSettings: function(val) 
  {
    this.remember = val;
    this.storage.setValue('remember', val);
    if(val === false) 
    {
      this.storage.reset();
    }
  },
  
  /**
   * Restores auth settings
   * @param {String} authType Can be oauth2, basic, noauth
   */
  restoreAuthSettings: function(authType) 
  {
    switch(authType) 
    {
      case REST_AUTHTYPE_OAUTH2:
        this._restoreOauth2Settings();
        break;
        
      case REST_AUTHTYPE_BASIC:
      default:
        this._restoreBasicAuthSettings();
        break;
    }
  },
  
  /**
   * Returns the storage handler to use, depending on context (either AIR database or localStorage feature)
   * @return {StorageHandler}
   */
  _getStorageHandler: function() 
  {
    if(this._storageHandler == null) 
    {
      if(this.isAir) 
      {
        this._storageHandler = new AirStorageHandler();
      } 
      else 
      {
        this._storageHandler = new LocalStorageHandler();
      }
    }
    
    return this._storageHandler;
  },
  
  _restoreOauth2Settings: function() 
  {
    var clientId = this.storage.getValue('oauth2ClientId');
    $('#oauth2ClientId').val(clientId);
    var clientSecret = this.storage.getValue('oauth2ClientSecret');
    $('#oauth2ClientSecret').val(clientSecret);
    var clientEndpoint = this.storage.getValue('oauth2ClientEndpoint');
    $('#oauth2ClientEndpoint').val(clientEndpoint);
    var accessToken = this.storage.getValue('oauth2AccessToken');
    $('#oauth2AccessToken').val(accessToken);
    var refreshToken = this.storage.getValue('oauth2RefreshToken');
    $('#oauth2RefreshToken').val(refreshToken);
  },
  
  _restoreBasicAuthSettings: function() 
  {
    
  },
  
  /**
   * Sends the REST request
   * @param {String} authType
   */
  sendRequest: function(authType) 
  {
    var req = this._getRequestHandler(authType);
    req.send();
  },
  
  /**
   * Returs appropriate request handler for given authType
   * @param {String} authType
   */
  _getRequestHandler: function(authType) 
  {
    if(this.requestHandler === null || this.requestHandler.authType != authType) 
    {
      this.requestHandler = null;
      switch(authType) 
      {
        case REST_AUTHTYPE_OAUTH2:
          this.requestHandler = new OAuth2RequestHandler();
          break;
          
        case REST_AUTHTYPE_BASIC:
        default:
          this.requestHandler = new BasicAuthRequestHandler();
          break;
      }
    }
    
    return this.requestHandler;
  }
  
};

