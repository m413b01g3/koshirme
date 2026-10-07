(() => {
  'use strict';
  const {slides,sources}=window.PRESENTATION;
  const palette={acid:'#e8f05a',ink:'#141414',paper:'#f4f4ef',blue:'#3156ef',coral:'#fb684c'};
  const deck=document.querySelector('#deck');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const hasGSAP=typeof gsap!=='undefined';
  let current=0,busy=false,lastGesture=0,ambient=null;
  deck.innerHTML=slides.map((s,i)=>`<section id="${s.id}" class="slide theme-${s.theme}" style="background-color:${palette[s.theme]}" role="group" aria-roledescription="слайд" aria-label="${i+1} / ${slides.length}: ${s.title}" aria-hidden="true" inert><div class="slide-inner">${s.html}</div></section>`).join('');
  const panels=[...deck.children];
  document.querySelector('#total-number').textContent=String(slides.length).padStart(2,'0');
  document.querySelector('#progress').innerHTML=slides.map((s,i)=>`<button data-slide="${i}" aria-label="${i+1}. ${s.title}" title="${s.title}"></button>`).join('');
  const menuTitles=['Цифрлық пираттық','19 088 оқушы','Термин мен жағдай','40,7%','Ыңғайлылық алда','Жиі кездеседі ≠ құпталады','Үш ықтимал механизм','Баға және әдет','Бес түрлі жағдай','Нақты таңдауға ықпал ету','Таралу ≠ мақұлдау'];
  document.querySelector('#overview-grid').innerHTML=slides.map((s,i)=>`<button class="overview-tile theme-${s.theme}" data-slide="${i}" aria-label="${i+1}. ${s.title}"><span>${String(i+1).padStart(2,'0')}</span><strong>${menuTitles[i]||s.title}</strong></button>`).join('');
  document.querySelector('#source-list').innerHTML=sources.map(s=>`<li>${s}</li>`).join('');
  function updateChrome(i){
    const s=slides[i];
    document.body.className=`theme-${s.theme}`;
    document.body.style.backgroundColor=palette[s.theme];
    document.querySelector('meta[name="theme-color"]').content=palette[s.theme];
    document.querySelector('#current-number').textContent=String(i+1).padStart(2,'0');
    document.querySelector('#chapter-label').textContent=s.name;
    document.querySelector('#previous').disabled=i===0;
    document.querySelector('#next').disabled=i===slides.length-1;
    document.querySelectorAll('#progress button').forEach((b,j)=>{b.className=j===i?'current':j<i?'past':'';b.setAttribute('aria-current',j===i?'step':'false')});
    document.querySelectorAll('.overview-tile').forEach((b,j)=>b.setAttribute('aria-current',j===i));
    document.querySelector('#announcement').textContent=`${i+1} / ${slides.length}. ${s.title}`;
    history.replaceState(null,'',`#${s.id}`);
  }
  function enter(i,dir=1){
    const p=panels[i];
    if(ambient){ambient.kill();ambient=null}
    if(!hasGSAP||reduced.matches){p.querySelectorAll('[data-count]').forEach(e=>e.textContent=Number(e.dataset.count).toLocaleString('ru-RU'));return}
    const reveal=p.querySelectorAll('.reveal'),lines=p.querySelectorAll('.title-line>span');
    if(reveal.length)gsap.fromTo(reveal,{y:28*dir,opacity:0},{y:0,opacity:1,duration:.72,ease:'power3.out',stagger:.075,delay:.12,clearProps:'transform,opacity'});
    if(lines.length)gsap.fromTo(lines,{yPercent:115*dir},{yPercent:0,duration:1,ease:'power4.out',stagger:.09,delay:.03,clearProps:'transform'});
    p.querySelectorAll('[data-count]').forEach(e=>{const value={v:0};gsap.to(value,{v:Number(e.dataset.count),duration:1.1,ease:'power2.out',onUpdate:()=>{e.textContent=Math.round(value.v).toLocaleString('ru-RU')}})});
    p.querySelectorAll('[data-decimal]').forEach(e=>{const value={v:0};gsap.to(value,{v:Number(e.dataset.decimal),duration:1.15,ease:'power2.out',onUpdate:()=>{e.textContent=value.v.toFixed(1).replace('.',',')}})});
    const bars=p.querySelectorAll('.bar-fill'),segments=p.querySelectorAll('.segment');
    if(bars.length)gsap.fromTo(bars,{scaleX:0},{scaleX:1,duration:1.2,ease:'power3.inOut',stagger:.07,delay:.1,clearProps:'transform'});
    if(segments.length)gsap.fromTo(segments,{scaleX:0},{scaleX:1,duration:1,ease:'power3.inOut',stagger:.08,clearProps:'transform'});
    if(p.querySelector('.not-equal'))gsap.fromTo(p.querySelector('.not-equal'),{scale:.65,rotation:8},{scale:1,rotation:-8,duration:1.3,delay:.15,ease:'elastic.out(1,.65)'});
    if(p.querySelector('.disc-main')){ambient=gsap.to(p.querySelector('.disc-main'),{rotation:'+=5',y:-12,duration:5,ease:'sine.inOut',repeat:-1,yoyo:true})}
  }
  function go(index,dir){
    index=Math.max(0,Math.min(slides.length-1,index));
    if(index===current||busy)return;
    dir=dir||Math.sign(index-current);
    const old=panels[current],next=panels[index];
    const oldIndex=current;current=index;busy=true;
    old.inert=true;old.setAttribute('aria-hidden','true');
    next.inert=false;next.setAttribute('aria-hidden','false');next.classList.add('active');
    updateChrome(index);
    if(!hasGSAP||reduced.matches){old.classList.remove('active');enter(index);busy=false;return}
    gsap.killTweensOf(old.querySelectorAll('.reveal,.title-line>span,[data-count],.bar-fill,.segment'));
    const seam=(index===5||oldIndex===5||index===slides.length-1);
    if(seam){
      const shutter=document.querySelector('.transition-shutter');shutter.style.visibility='visible';
      const strips=shutter.children;
      gsap.set(strips,{backgroundColor:index===5?'#3156ef':'#e8f05a',scaleY:0,transformOrigin:dir>0?'bottom':'top'});
      gsap.timeline({onComplete:()=>{shutter.style.visibility='hidden';busy=false}})
        .to(strips,{scaleY:1,duration:.36,stagger:.025,ease:'power3.in'})
        .call(()=>{old.classList.remove('active');enter(index,dir)})
        .set(strips,{transformOrigin:dir>0?'top':'bottom'})
        .to(strips,{scaleY:0,duration:.6,stagger:.025,ease:'power3.out'});
    }else{
      next.style.zIndex='3';old.style.zIndex='2';
      gsap.set(next,{clipPath:dir>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)'});
      gsap.fromTo(next.querySelector('.slide-inner'),{xPercent:6*dir},{xPercent:0,duration:.95,ease:'power3.inOut',clearProps:'transform'});
      gsap.to(old.querySelector('.slide-inner'),{xPercent:-4*dir,opacity:.55,duration:.7,ease:'power2.in'});
      gsap.to(next,{clipPath:'inset(0 0 0 0)',duration:.8,ease:'power3.inOut',onComplete:()=>{old.classList.remove('active');gsap.set(old.querySelector('.slide-inner'),{clearProps:'transform,opacity'});gsap.set(next,{clearProps:'clipPath,zIndex'});busy=false}});
      enter(index,dir);
    }
    if(old.contains(document.activeElement))deck.focus({preventScroll:true});
  }
  const openDialog=id=>{const d=document.getElementById(id);if(!d.open)d.showModal()};
  document.querySelector('#overview-open').onclick=()=>openDialog('overview-dialog');
  document.querySelector('#sources-open').onclick=()=>openDialog('sources-dialog');
  document.querySelector('#notes-open').onclick=()=>{document.querySelector('#notes-title').textContent=slides[current].title;document.querySelector('#notes-content').innerHTML=slides[current].notes;openDialog('notes-dialog')};
  document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.dialog-close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
  document.querySelector('#previous').onclick=()=>go(current-1);
  document.querySelector('#next').onclick=()=>go(current+1);
  document.querySelector('#home').onclick=()=>go(0);
  document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{document.querySelector('#announcement').textContent='Толық экран браузерде қолжетімсіз'}};
  document.addEventListener('fullscreenchange',()=>{const b=document.querySelector('#fullscreen');b.setAttribute('aria-label',document.fullscreenElement?'Толық экраннан шығу':'Толық экран');b.title=b.getAttribute('aria-label')});
  document.addEventListener('click',e=>{const jump=e.target.closest('[data-slide]');if(jump){document.querySelector('#overview-dialog').close();go(Number(jump.dataset.slide))}if(e.target.closest('[data-next]'))go(current+1);if(e.target.closest('[data-open-sources]'))openDialog('sources-dialog')});
  document.querySelectorAll('[data-mechanism]').forEach(b=>b.addEventListener('click',()=>{
    if(b.classList.contains('is-expanded'))return;
    document.querySelectorAll('[data-mechanism]').forEach(panel=>{const expanded=panel===b;panel.classList.toggle('is-expanded',expanded);panel.setAttribute('aria-expanded',expanded);panel.querySelector('.mechanism-plus').textContent=expanded?'−':'+'});
  }));
  const conditions=[
    'Фильм Қазақстанда заңды түрде қолжетімді. Бағасы орынды.',
    'Фильм Қазақстандағы ешбір ресми сервисте қолжетімді емес.',
    'Фильм заңды қолжетімді, бірақ тағы бір қымбат жазылымды қажет етеді.',
    'Фильм заңды қолжетімді. Достары бейресми көзді пайдаланады және сілтеме жібереді.',
    'Заңды төлем шағын жергілікті студияға және фильм авторларына тікелей қолдау береді.'
  ];
  const ratings=Array(5).fill(null);let scenario=0;
  function updateRating(){document.querySelectorAll('[data-rating]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.rating)===ratings[scenario]));document.querySelector('#rating-status').textContent=ratings[scenario]?`Осы жағдайдағы бағаңыз: ${ratings[scenario]} / 7`:'Бағаңызды таңдаңыз'}
  function chooseScenario(i,focus=false){scenario=i;document.querySelectorAll('[data-scenario]').forEach(b=>{const active=Number(b.dataset.scenario)===i;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;if(active&&focus)b.focus()});document.querySelector('#scenario-panel').setAttribute('aria-labelledby',`scenario-tab-${i}`);const condition=document.querySelector('#scenario-condition');condition.textContent=conditions[i];if(hasGSAP&&!reduced.matches)gsap.fromTo(condition,{opacity:0,y:8},{opacity:1,y:0,duration:.4,clearProps:'opacity,transform'});updateRating()}
  document.querySelectorAll('[data-scenario]').forEach(b=>{b.addEventListener('click',()=>chooseScenario(Number(b.dataset.scenario)));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const i=e.key==='Home'?0:e.key==='End'?4:(scenario+(e.key==='ArrowRight'?1:4))%5;chooseScenario(i,true)})});
  document.querySelectorAll('[data-rating]').forEach(b=>b.addEventListener('click',()=>{ratings[scenario]=Number(b.dataset.rating);updateRating()}));
  document.addEventListener('keydown',e=>{
    if(document.querySelector('dialog[open]')||e.target.matches('input,textarea,select')||e.altKey||e.ctrlKey||e.metaKey)return;
    if(['ArrowRight','ArrowDown','PageDown'].includes(e.key)||(e.code==='Space'&&!e.target.closest('button,a'))){e.preventDefault();go(current+1)}
    if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(current-1)}
    if(e.key==='Home'){e.preventDefault();go(0)}if(e.key==='End'){e.preventDefault();go(slides.length-1)}
  });
  function gesture(direction){if(document.querySelector('dialog[open]')||performance.now()-lastGesture<1000)return;lastGesture=performance.now();go(current+direction)}
  let touchStart=null;
  deck.addEventListener('pointerdown',e=>{if((e.pointerType==='touch'||e.button===0)&&!e.target.closest('button,input,a,.mechanism-panel')){touchStart={x:e.clientX,y:e.clientY};deck.setPointerCapture(e.pointerId)}});
  deck.addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.15)gesture(dx<0?1:-1);else if(Math.abs(dy)>65&&Math.abs(dy)>Math.abs(dx)*1.15)gesture(dy<0?1:-1)});
  deck.addEventListener('pointercancel',()=>touchStart=null);
  if(hasGSAP&&typeof Observer!=='undefined'){gsap.registerPlugin(Observer);Observer.create({target:deck,type:'wheel',tolerance:35,onDown:()=>gesture(1),onUp:()=>gesture(-1),onRight:()=>gesture(1),onLeft:()=>gesture(-1),preventDefault:true,ignore:'button,input,a,dialog'})}
  else deck.addEventListener('wheel',e=>{e.preventDefault();if(Math.abs(e.deltaY)>30)gesture(e.deltaY>0?1:-1)},{passive:false});
  let moveFrame=false;
  deck.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch'||moveFrame)return;moveFrame=true;requestAnimationFrame(()=>{moveFrame=false;const disc=panels[current].querySelector('.disc-stage');if(disc&&hasGSAP)gsap.to(disc,{rotationY:(e.clientX/innerWidth-.5)*10,rotationX:(.5-e.clientY/innerHeight)*8,duration:1.3,ease:'power2.out'})})});
  document.addEventListener('visibilitychange',()=>{if(ambient){if(document.hidden)ambient.pause();else ambient.resume()}});
  reduced.addEventListener('change',()=>{if(ambient&&reduced.matches){ambient.kill();ambient=null}});
  const initial=slides.findIndex(s=>`#${s.id}`===location.hash);current=initial<0?0:initial;
  panels[current].classList.add('active');panels[current].inert=false;panels[current].setAttribute('aria-hidden','false');updateChrome(current);enter(current);
})();
