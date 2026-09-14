const menu=document.querySelector('.menu'),nav=document.querySelector('header nav');
menu?.addEventListener('click',()=>nav?.classList.toggle('open'));
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const input=document.querySelector('#search'),buttons=[...document.querySelectorAll('.filters button')],cards=[...document.querySelectorAll('.card')],sections=[...document.querySelectorAll('.category')],status=document.querySelector('#status');
let filter='all';
function apply(){
 if(!input)return;
 const q=input.value.trim().toLowerCase();let count=0;
 cards.forEach(card=>{const show=(filter==='all'||card.dataset.cat===filter)&&(!q||card.dataset.q.includes(q));card.classList.toggle('is-hidden',!show);if(show)count++});
 sections.forEach(section=>section.classList.toggle('is-hidden',![...section.querySelectorAll('.card')].some(card=>!card.classList.contains('is-hidden'))));
 status.textContent=q||filter!=='all'?`Найдено решений: ${count}`:'';
}
input?.addEventListener('input',apply);
buttons.forEach(button=>button.addEventListener('click',()=>{buttons.forEach(x=>x.classList.remove('active'));button.classList.add('active');filter=button.dataset.filter;apply()}));
