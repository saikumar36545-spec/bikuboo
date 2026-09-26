(function(){
  const HOME_FIELDS = [
    ['bkHomeFrom','bkHomeFromSuggestions'],
    ['bkHomeTo','bkHomeToSuggestions']
  ];

  function install(){
    const ready = typeof window.fetchGeoapifySuggestions === 'function';
    if(!ready) return false;

    HOME_FIELDS.forEach(([inputId, boxId])=>{
      const input=document.getElementById(inputId);
      if(!input || input.dataset.bkAutocompleteReady==='1') return;

      const label=input.closest('.bk-inline-field');
      if(!label) return;
      label.style.position='relative';

      let box=document.getElementById(boxId);
      if(!box){
        box=document.createElement('div');
        box.id=boxId;
        box.className='place-suggestions bk-home-place-suggestions';
        label.appendChild(box);
      }

      input.dataset.bkAutocompleteReady='1';
      input.setAttribute('autocomplete','off');

      input.addEventListener('input',()=>{
        if(typeof window.clearPlaceData==='function') window.clearPlaceData(input);
        if(typeof window.closeLocationMenus==='function') window.closeLocationMenus(boxId);
        window.fetchGeoapifySuggestions(input,box);
      });

      input.addEventListener('focus',()=>{
        if(input.value.trim().length>=2) window.fetchGeoapifySuggestions(input,box);
      });
    });

    const findBtn=document.getElementById('bkHomeSearch');
    if(findBtn && findBtn.dataset.bkLocationSync!=='1'){
      findBtn.dataset.bkLocationSync='1';
      findBtn.addEventListener('click',()=>{
        const pairs=[['bkHomeFrom','from'],['bkHomeTo','to']];
        pairs.forEach(([homeId,realId])=>{
          const home=document.getElementById(homeId),real=document.getElementById(realId);
          if(!home||!real)return;
          real.value=home.value.trim();
          ['placeId','lat','lng','resultType','city','state','country','street','postcode'].forEach(k=>{
            if(home.dataset[k]!==undefined) real.dataset[k]=home.dataset[k];
            else delete real.dataset[k];
          });
        });
      });
    }
    return true;
  }

  const style=document.createElement('style');
  style.textContent=`
    .bk-inline-field{position:relative;overflow:visible!important}
    .bk-home-place-suggestions{position:absolute!important;left:8px!important;right:8px!important;top:calc(100% + 8px)!important;z-index:10050!important;max-height:300px;overflow:auto;text-align:left}
    .bk-home-place-suggestions .place-suggestion{display:block;width:100%;text-align:left;padding:10px 12px;border:0;background:#fff;cursor:pointer}
    .bk-home-place-suggestions .place-suggestion:hover{background:#f1f7ec}
    .bk-home-place-suggestions .place-suggestion small{display:block;margin-top:3px;color:#718070;font-size:10px}
    .bk-home-place-suggestions .place-brand{padding:7px 10px;background:#f7faf4;color:#6b7b69;font-size:10px}
  `;
  document.head.appendChild(style);

  function boot(){
    if(install()) return;
    let tries=0;
    const timer=setInterval(()=>{
      if(install() || ++tries>120) clearInterval(timer);
    },100);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  new MutationObserver(()=>install()).observe(document.documentElement,{childList:true,subtree:true});
})();
