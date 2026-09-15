(function(){
  function setup(){
    var staticBar=document.getElementById('mobileAuthActions');
    if(staticBar){
      var old=document.getElementById('mobileTopActions');
      if(old) old.remove();
      return;
    }
    var header=document.querySelector('.site-header');
    if(!header || document.getElementById('mobileTopActions')) return;
    var bar=document.createElement('div');
    bar.id='mobileTopActions';
    bar.innerHTML='<button id="mobileInstallBtn" type="button">📲 Install App</button><button id="mobileLoginBtn" type="button">Log in</button><button id="mobileSignupBtn" type="button">Create account</button>';
    header.insertAdjacentElement('afterend',bar);
    var style=document.createElement('style');
    style.textContent=`
      #mobileTopActions{display:none}
      @media(max-width:700px){
        #mobileTopActions{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:8px;padding:9px 12px;background:#fff;border-bottom:1px solid rgba(15,23,42,.08);position:relative;z-index:9999;box-shadow:0 3px 14px rgba(15,23,42,.07)}
        #mobileTopActions button{border:0;border-radius:12px;padding:11px 7px;font:700 13px/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}
        #mobileInstallBtn{background:#b7f36b;color:#08110a}
        #mobileLoginBtn{background:#eef5ff;color:#173b68}
        #mobileSignupBtn{background:#ff7a1a;color:#fff}
      }
    `;
    document.head.appendChild(style);
    document.getElementById('mobileLoginBtn').onclick=function(){window.openModal&&window.openModal('login')};
    document.getElementById('mobileSignupBtn').onclick=function(){window.openModal&&window.openModal('signup')};
    document.getElementById('mobileInstallBtn').onclick=function(){
      var btn=document.getElementById('installAppBtn');
      if(btn){btn.hidden=false;btn.click();return;}
      if(/iphone|ipad|ipod/i.test(navigator.userAgent)) alert('To install BIKUBOO: tap Share, then Add to Home Screen.');
      else alert('Open your browser menu and choose Install app or Add to home screen.');
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();