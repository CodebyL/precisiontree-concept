/* Shared behaviour for the rebuilt concept sites: sticky header offset, accessible menu,
   active section, scroll reveals, carousels, accordions, tabs, preview-mode forms. */
(function(){
  var d=document.documentElement,$=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var hdr=$('[data-header]');
  var setH=function(){if(hdr)d.style.setProperty('--hh',Math.round(hdr.getBoundingClientRect().height)+'px')};
  setH();addEventListener('resize',setH);addEventListener('load',setH);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(setH);
  var top0=hdr?hdr.getBoundingClientRect().top+scrollY:0;var stuck=function(){if(hdr)hdr.classList.toggle('is-stuck',scrollY>top0+4)};stuck();addEventListener('scroll',stuck,{passive:true});

  // menu
  var tog=$('[data-menu-toggle]'),panel=tog&&document.getElementById(tog.getAttribute('aria-controls'));
  if(tog&&panel){
    var setOpen=function(o,back){panel.hidden=!o;tog.setAttribute('aria-expanded',String(o));tog.classList.toggle('is-open',o);var l=$('.mlbl',tog);if(l)l.textContent=o?'Close':'Menu';
      if(o){var f=$('a,button',panel);if(f)f.focus({preventScroll:true})}else if(back)tog.focus()};
    tog.addEventListener('click',function(e){e.stopPropagation();setOpen(panel.hidden)});
    $$('a',panel).forEach(function(a){a.addEventListener('click',function(){setOpen(false)})});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden)setOpen(false,true)});
    document.addEventListener('click',function(e){if(!panel.hidden&&!panel.contains(e.target))setOpen(false)});
    addEventListener('resize',function(){if(!panel.hidden&&!tog.offsetParent)setOpen(false)});
  }

  // active section
  var links=$$('[data-nav] a[href^="#"]').filter(function(a){var h=a.getAttribute('href');return h.length>1&&document.getElementById(h.slice(1))});
  if(links.length){var ids=[];links.forEach(function(a){var i=a.getAttribute('href').slice(1);if(ids.indexOf(i)<0)ids.push(i)});
    ids.sort(function(a,b){return document.getElementById(a).compareDocumentPosition(document.getElementById(b))&2?1:-1});
    var cur,tk;var upd=function(){tk=0;var hh=parseFloat(getComputedStyle(d).getPropertyValue('--hh'))||0,line=hh+Math.min(160,innerHeight*.25),pick=null;
      ids.forEach(function(i){if(document.getElementById(i).getBoundingClientRect().top<=line)pick=i});
      if(Math.ceil(scrollY+innerHeight)>=d.scrollHeight-2)pick=ids[ids.length-1];
      if(pick===cur)return;cur=pick;links.forEach(function(a){if(a.getAttribute('href')==='#'+pick)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')})};
    addEventListener('scroll',function(){if(!tk){tk=1;requestAnimationFrame(upd)}},{passive:true});addEventListener('resize',upd);upd();}

  // reveals (observe parent so clip-path-hidden targets still trigger)
  if(d.classList.contains('anim')&&'IntersectionObserver' in window){
    var groups=new Map();$$('[data-rv]').forEach(function(el){var p=el.parentElement;if(!groups.has(p))groups.set(p,[]);groups.get(p).push(el)});
    groups.forEach(function(list){list.forEach(function(el,i){if(!el.style.getPropertyValue('--d'))el.style.setProperty('--d',(i*0.09).toFixed(2)+'s')})});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){(groups.get(e.target)||[]).forEach(function(el){el.classList.add('in')});io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    groups.forEach(function(v,p){io.observe(p)});
  }
  window.__rv=1;

  // carousels
  $$('[data-carousel]').forEach(function(c){var t=$('[data-track]',c);if(!t)return;var step=function(dir){var card=t.children[0];var w=card?card.getBoundingClientRect().width+parseFloat(getComputedStyle(t).columnGap||getComputedStyle(t).gap||16):300;t.scrollBy({left:dir*w,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
    $$('[data-prev]',c).forEach(function(b){b.addEventListener('click',function(){step(-1)})});$$('[data-next]',c).forEach(function(b){b.addEventListener('click',function(){step(1)})});});

  // accordions
  $$('[data-acc] button[aria-controls]').forEach(function(b){b.addEventListener('click',function(){var acc=b.closest('[data-acc]'),open=b.getAttribute('aria-expanded')==='true';
    $$('button[aria-controls]',acc).forEach(function(o){o.setAttribute('aria-expanded','false');document.getElementById(o.getAttribute('aria-controls')).hidden=true});
    if(!open){b.setAttribute('aria-expanded','true');document.getElementById(b.getAttribute('aria-controls')).hidden=false}})});

  // tabs (role=tablist)
  $$('[role="tablist"]').forEach(function(tl){var tabs=$$('[role="tab"]',tl);
    var sel=function(t,focus){var keep=t.getAttribute('aria-controls');tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',String(on));x.tabIndex=on?0:-1;var id=x.getAttribute('aria-controls'),p=document.getElementById(id);if(p)p.hidden=(id!==keep)});if(focus)t.focus();tl.dispatchEvent(new CustomEvent('tabchange',{detail:t}))};
    tabs.forEach(function(t,i){t.addEventListener('click',function(){sel(t)});t.addEventListener('keydown',function(e){var k=e.key,n=null;var v=tl.getAttribute('aria-orientation')==='vertical';
      if(k===(v?'ArrowDown':'ArrowRight'))n=tabs[(i+1)%tabs.length];if(k===(v?'ArrowUp':'ArrowLeft'))n=tabs[(i-1+tabs.length)%tabs.length];if(k==='Home')n=tabs[0];if(k==='End')n=tabs[tabs.length-1];if(n){e.preventDefault();sel(n,true)}})});});

  // forms: preview mode, nothing is sent
  $$('form[data-preview]').forEach(function(f){f.setAttribute('novalidate','');var err=$('[data-err]',f),ok=$('[data-ok]',f),sb=$('[type="submit"]',f);
    f.addEventListener('submit',function(e){e.preventDefault();var name=$('[name="name"]',f),tel=$('[name="phone"]',f),em=$('[name="email"]',f),msg='';
      var digits=tel?tel.value.replace(/\D/g,''):'';var emv=em?em.value.trim():'';var emOk=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emv);
      if(name&&!name.value.trim()){msg='Please add your name.';name.focus()}
      else if(tel&&em&&digits.length<10&&!emOk){msg='Add a 10-digit phone number or a valid email so the shop can reach you.';tel.focus()}
      else if(tel&&!em&&digits.length<10){msg='Please add a 10-digit phone number.';tel.focus()}
      else if(em&&emv&&!emOk){msg='That email address looks incomplete.';em.focus()}
      if(msg){err.textContent=msg;err.hidden=false;ok.hidden=true;return}
      err.hidden=true;var lbl=sb.innerHTML;sb.disabled=true;sb.setAttribute('aria-busy','true');sb.innerHTML='Sending…';
      setTimeout(function(){sb.disabled=false;sb.removeAttribute('aria-busy');sb.innerHTML=lbl;var n=$('[data-name]',ok);if(n)n.textContent=name?name.value.trim().split(' ')[0]:'';ok.hidden=false;ok.focus()},650)});});

  // direct links: realign after layout settles
  if(location.hash.length>1){var t=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(t)addEventListener('load',function(){setH();t.scrollIntoView({block:'start'})})}
})();
