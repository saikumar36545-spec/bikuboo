(function(){
  var deferredPrompt=null;
  function setup(){
    var btn=document.getElementById('installAppBtn');
    if(!btn) return;
    window.addEventListener('beforeinstallprompt',function(e){
      e.preventDefault();
      deferredPrompt=e;
      btn.hidden=false;
    });
    window.addEventListener('appinstalled',function(){
      deferredPrompt=null;
      btn.hidden=true;
    });
    btn.addEventListener('click',async function(){
      if(!deferredPrompt){
        if(/iphone|ipad|ipod/i.test(navigator.userAgent)){
          alert('To install BIKUBOO on iPhone: tap Share, then Add to Home Screen.');
        } else {
          alert('If the install prompt is not available, use your browser menu and choose Install app or Add to Home screen.');
        }
        return;
      }
      deferredPrompt.prompt();
      try{ await deferredPrompt.userChoice; }catch(e){}
      deferredPrompt=null;
      btn.hidden=true;
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup); else setup();
})();
