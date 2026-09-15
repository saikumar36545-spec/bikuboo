(function(){
  function polish(){
    var root=document.getElementById('bikuboo-launch-home');
    if(!root)return;
    var style=document.getElementById('bikuboo-landing-polish');
    if(!style){
      style=document.createElement('style');
      style.id='bikuboo-landing-polish';
      style.textContent=`
        #bikuboo-launch-home .bk-mini-card{display:none!important}
        #bikuboo-launch-home .bk-phone-icons{display:none!important}
        #bikuboo-launch-home .bk-phone-screen img{background:transparent!important;box-shadow:none!important;mix-blend-mode:multiply;}
        #bikuboo-launch-home .bk-phone-screen{background:linear-gradient(180deg,#f8fbff 0%,#fff 62%,#fff 100%)}
      `;
      document.head.appendChild(style);
    }
    root.querySelectorAll('.bk-mini-card,.bk-phone-icons').forEach(function(el){el.remove()});
  }
  function start(){setTimeout(polish,80);setTimeout(polish,500);setTimeout(polish,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  new MutationObserver(function(){polish()}).observe(document.documentElement,{childList:true,subtree:true});
})();
