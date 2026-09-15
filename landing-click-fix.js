(function(){
  function fix(){
    var style=document.getElementById('bikuboo-click-fix-style');
    if(!style){
      style=document.createElement('style');
      style.id='bikuboo-click-fix-style';
      style.textContent=`
        #bikuboo-launch-home{position:relative;z-index:1;pointer-events:auto}
        #bikuboo-launch-home .bk-hero{position:relative;z-index:1}
        #bikuboo-launch-home .bk-actions,
        #bikuboo-launch-home .bk-actions .bk-btn{position:relative;z-index:100;pointer-events:auto!important;cursor:pointer}
        #bikuboo-launch-home .bk-hero-art{position:relative;z-index:2}
        #bikuboo-launch-home .bk-scene,
        #bikuboo-launch-home .bk-sky,
        #bikuboo-launch-home .bk-city,
        #bikuboo-launch-home .bk-road,
        #bikuboo-launch-home .bk-bike,
        #bikuboo-launch-home .bk-wheel,
        #bikuboo-launch-home .bk-frame,
        #bikuboo-launch-home .bk-rider,
        #bikuboo-launch-home .bk-mini-card{pointer-events:none}
        #bikuboo-launch-home .bk-phone{pointer-events:auto;z-index:110}
        #bikuboo-launch-home .bk-phone-btn{pointer-events:auto;cursor:pointer}
      `;
      document.head.appendChild(style);
    }
    var root=document.getElementById('bikuboo-launch-home');
    if(!root) return;
    root.querySelectorAll('.bk-actions a').forEach(function(btn){
      btn.addEventListener('click',function(e){
        var id=this.getAttribute('href');
        if(id && id.charAt(0)==='#'){
          var target=document.querySelector(id);
          if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
        }
      });
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(fix,50)}); else setTimeout(fix,50);
  var mo=new MutationObserver(function(){if(document.getElementById('bikuboo-launch-home')) fix()});
  mo.observe(document.documentElement,{childList:true,subtree:true});
})();
