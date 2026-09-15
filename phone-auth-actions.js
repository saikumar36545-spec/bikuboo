(function(){
  function wire(){
    var root=document.getElementById('bikuboo-launch-home');
    if(!root) return false;
    root.querySelectorAll('.bk-phone-btn').forEach(function(btn){
      if(btn.dataset.authWired==='1') return;
      btn.dataset.authWired='1';
      btn.type='button';
      btn.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        var text=(btn.textContent||'').toLowerCase();
        if(text.indexOf('create')>=0 || text.indexOf('sign up')>=0) window.openModal?.('signup');
        else window.openModal?.('login');
      });
    });
    return true;
  }
  function start(){
    if(wire()) return;
    var tries=0;
    var timer=setInterval(function(){if(wire()||++tries>80)clearInterval(timer)},100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
