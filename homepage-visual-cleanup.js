(function(){
  function clean(){
    var root=document.getElementById('bikuboo-launch-home');
    if(!root) return false;
    var style=document.getElementById('bikuboo-visual-cleanup-style');
    if(!style){
      style=document.createElement('style');
      style.id='bikuboo-visual-cleanup-style';
      style.textContent=`
        /* Remove decorative elements that look like accidental markup */
        #bikuboo-launch-home .bk-phone-icons{display:none!important}
        #bikuboo-launch-home .bk-mini-card{display:none!important}
        /* Keep the phone clean and make the real auth controls the focus */
        #bikuboo-launch-home .bk-phone{background:#fff}
        #bikuboo-launch-home .bk-phone-screen img{mix-blend-mode:multiply;background:transparent;object-fit:contain;filter:saturate(1.05);}
        #bikuboo-launch-home .bk-phone-screen{background:linear-gradient(180deg,#ffffff 0%,#fbfdff 100%)}
        #bikuboo-launch-home .bk-phone-btn{position:relative;z-index:200}
        /* Remove any stray sketch/outline decoration injected around the phone */
        #bikuboo-launch-home .bk-phone-screen svg,
        #bikuboo-launch-home .bk-phone-screen canvas{display:none!important}
      `;
      document.head.appendChild(style);
    }
    root.querySelectorAll('.bk-phone-icons').forEach(function(el){el.remove();});
    root.querySelectorAll('.bk-mini-card').forEach(function(el){el.remove();});
    return true;
  }
  function start(){
    if(clean()) return;
    var tries=0;
    var timer=setInterval(function(){if(clean()||++tries>100)clearInterval(timer)},100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
