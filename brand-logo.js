(function(){
  function applyLogo(){
    document.querySelectorAll('.logo').forEach(function(el){
      if(el.querySelector('img')) return;
      el.innerHTML='<img src="assets/bikuboo-logo.webp" alt="BIKUBOO" loading="eager">';
      el.setAttribute('aria-label','BIKUBOO home');
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyLogo); else applyLogo();
})();