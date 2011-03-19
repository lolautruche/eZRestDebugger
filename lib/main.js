var rest = new RestClient();
$(document).ready(function() {

  rest.init();
  
  // Authentication type selection, display the right form elements
  $('#authenticationTypeSelection').change(function() {
    var authType = $(this).val();
    if (rest.remember) {
      rest.storage.setValue('authType', authType);
    }
    
    $('.authType').fadeOut('slow', function() {
      var authTypeEl = $('#'+authType);
      if(authTypeEl.length) {
        authTypeEl.fadeIn('slow');
        rest.restoreAuthSettings(authType);
      }
    });
    
  });
  
  // Store input value
  $('input.inputText').focusout(function() {
    if (rest.remember) {
      rest.storage.setValue($(this).attr('id'), $(this).val());
    }
  });
  
  // Remember my settings
  $('#rememberSettings').click(function() {
    var doRemember = false;
    if($(this).is(':checked')) {
      doRemember = true;
      rest.storeSettings();
    }
    
    rest.setRememberSettings(doRemember);
  });
  
  $('input[name="method"]').click(function() {
    if(rest.remember) {
      rest.storage.setValue('restMethod', $(this).val());
    }
  });
  
  // Send the REST request
  $('#submit').click(function() {
    var authType = $('#authenticationTypeSelection').val();
    rest.sendRequest(authType);
  });
  
  $(document).keypress(function(evt) {
    if(evt.which == 13) // Enter
    {
      evt.preventDefault();
      $('#submit').click();
    }
  });
  
});

/**
 * Wrapper for trace function.
 * If in AIR environment, will use air.trace(). Otherwise will use console.log()
 * @param {Object} message
 */
function trace(message) {
  if(typeof(window.runtime) != 'undefined')
    air.trace(message);
  else
    console.log(message);
}