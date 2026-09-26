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

        /* Final mobile fix for the intercity destination map. The map CSS is
           injected by landing-refresh.js, so this stylesheet is intentionally
           injected after it and uses !important for the mobile overrides. */
        @media(max-width:700px){
          #bikuboo-launch-home .bk-intercity-hero{width:100%!important;max-width:100%!important;overflow:hidden!important}
          #bikuboo-launch-home .bk-intercity-hero .bk-hero-grid{width:100%!important;max-width:100%!important;margin:0!important;padding-left:5%!important;padding-right:5%!important}
          #bikuboo-launch-home .bk-landmark-map{width:100%!important;max-width:100%!important;height:650px!important;min-height:650px!important;margin:0!important;border-radius:0!important;overflow:hidden!important;position:relative!important}
          #bikuboo-launch-home .bk-map-title{left:auto!important;right:12px!important;top:18px!important;width:205px!important;max-width:calc(100% - 24px)!important;font-size:22px!important;line-height:1.05!important;text-align:right!important;white-space:normal!important}
          #bikuboo-launch-home .bk-landmark-card{width:140px!important;max-width:140px!important;box-sizing:border-box!important}
          #bikuboo-launch-home .bk-landmark-card.hyd{top:13%!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important}
          #bikuboo-launch-home .bk-landmark-card.vij{top:31%!important;right:4%!important;left:auto!important}
          #bikuboo-launch-home .bk-landmark-card.viz{top:48%!important;left:4%!important;right:auto!important}
          #bikuboo-launch-home .bk-landmark-card.tir{top:64%!important;right:4%!important;left:auto!important}
          #bikuboo-launch-home .bk-landmark-card.bng{top:78%!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important}
          #bikuboo-launch-home .bk-landmark-img{width:100%!important;height:72px!important;max-width:none!important}
          #bikuboo-launch-home .bk-city-route{inset:0!important;width:100%!important;height:100%!important;max-width:none!important}
          #bikuboo-launch-home .bk-road-sign{right:4%!important;bottom:7%!important;font-size:9px!important}
          #bikuboo-launch-home .bk-bike-photo{left:2%!important;bottom:2%!important;width:125px!important;height:95px!important}
        }
        @media(max-width:390px){
          #bikuboo-launch-home .bk-map-title{right:10px!important;width:185px!important;max-width:calc(100% - 20px)!important;font-size:20px!important}
          #bikuboo-launch-home .bk-landmark-card{width:132px!important;max-width:132px!important}
          #bikuboo-launch-home .bk-landmark-img{height:68px!important}
        }
      `;
      document.head.appendChild(style);
    }
    root.querySelectorAll('.bk-mini-card,.bk-phone-icons').forEach(function(el){el.remove()});
  }
  function start(){setTimeout(polish,80);setTimeout(polish,500);setTimeout(polish,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  new MutationObserver(function(){polish()}).observe(document.documentElement,{childList:true,subtree:true});
})();
