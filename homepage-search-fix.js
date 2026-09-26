(function(){
  function boot(){
    const btn=document.getElementById('bkHomeSearch');
    if(!btn || btn.dataset.bkSearchFix==='1') return;
    btn.dataset.bkSearchFix='1';
    btn.addEventListener('click',function(){
      const date=document.getElementById('searchDate');
      if(date && !date.value) date.value=new Date().toISOString().slice(0,10);
    },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  new MutationObserver(boot).observe(document.documentElement,{childList:true,subtree:true});
})();
