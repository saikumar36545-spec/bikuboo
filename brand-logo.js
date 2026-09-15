(function(){
  function applyLogo(){
    var style=document.getElementById('bikuboo-logo-style');
    if(!style){
      style=document.createElement('style');
      style.id='bikuboo-logo-style';
      style.textContent='.site-header .logo,.site-header .logo{display:flex;align-items:center;width:150px;height:58px;overflow:hidden;flex:0 0 150px;text-decoration:none}.site-header .logo img{display:block;width:145px;height:auto;max-height:54px;object-fit:contain;object-position:left center}@media(max-width:900px){.site-header .logo{width:128px;height:52px;flex-basis:128px}.site-header .logo img{width:124px;max-height:48px}}@media(max-width:600px){.site-header .logo{width:112px;height:48px;flex-basis:112px}.site-header .logo img{width:108px;max-height:44px}}';
      document.head.appendChild(style);
    }
    document.querySelectorAll('.logo').forEach(function(el){
      if(el.querySelector('img')) return;
      el.innerHTML='<img src="assets/bikuboo-logo.webp" alt="BIKUBOO" loading="eager">';
      el.setAttribute('aria-label','BIKUBOO home');
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyLogo); else applyLogo();
})();
