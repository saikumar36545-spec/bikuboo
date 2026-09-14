(function(){'use strict';
const d=document;
const set=(name,content)=>{let m=d.head.querySelector('meta[name="'+name+'"]');if(!m){m=d.createElement('meta');m.name=name;d.head.appendChild(m)}m.content=content};
const prop=(name,content)=>{let m=d.head.querySelector('meta[property="'+name+'"]');if(!m){m=d.createElement('meta');m.setAttribute('property',name);d.head.appendChild(m)}m.content=content};
set('description','BIKUBOO is an India-focused bike pooling platform for finding and offering rides with profiles, ratings, safety tools, chat, payments and rewards.');
set('keywords','BIKUBOO, bike pooling India, bike ride sharing, bikepooling, ride sharing India, share bike ride');
set('robots','index,follow,max-image-preview:large');
set('author','BIKUBOO');
prop('og:type','website');prop('og:site_name','BIKUBOO');prop('og:title','BIKUBOO — Share the ride. Ride safer.');prop('og:description','Find verified riders going your way, or offer a seat on your bike.');prop('og:url',location.href);prop('og:image',new URL('icons/icon-512.png',location.href).href);
prop('twitter:card','summary');prop('twitter:title','BIKUBOO — Share the ride. Ride safer.');prop('twitter:description','Bike pooling made safer with verified riders, smart routes and safety tools.');prop('twitter:image',new URL('icons/icon-512.png',location.href).href);
let link=d.head.querySelector('link[rel="canonical"]');if(!link){link=d.createElement('link');link.rel='canonical';d.head.appendChild(link)}link.href=location.href.split('#')[0];
if(location.pathname.endsWith('/')||location.pathname.endsWith('/index.html')){const ld=d.createElement('script');ld.type='application/ld+json';ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'WebSite','name':'BIKUBOO','url':location.origin+'/' ,'description':'India-focused bike pooling platform with ride discovery, ride sharing and safety tools.'});d.head.appendChild(ld)}
})();
