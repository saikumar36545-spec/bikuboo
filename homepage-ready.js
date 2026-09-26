(function(){
  function ready(){
    if(document.getElementById('bikuboo-launch-home')){
      document.body.classList.add('bk-home-ready');
      return true;
    }
    return false;
  }
  if(ready()) return;
  var observer = new MutationObserver(function(){
    if(ready()) observer.disconnect();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.setTimeout(function(){
    document.body.classList.add('bk-home-ready');
    observer.disconnect();
  },3500);
})();
