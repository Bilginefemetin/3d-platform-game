const labels={market:'MARKET',inventory:'ENVANTER',ranking:'SIRALAMA',settings:'AYARLAR'};
const title=document.querySelector('#panel-title');
const content=document.querySelector('#panel-content');
const coinCount=document.querySelector('#coin-count');
const nameInput=document.querySelector('#character-name');

let coins=Number(localStorage.getItem('arenaCoins')||0);
coinCount.textContent=coins.toLocaleString('tr-TR');
nameInput.value=localStorage.getItem('arenaCharacterName')||'İsimsiz Karakter';
nameInput.addEventListener('input',()=>localStorage.setItem('arenaCharacterName',nameInput.value.trim()||'İsimsiz Karakter'));

const bundles=[
  {type:'KASA',name:'UCUZ KASA',price:1000,desc:'Karakter kozmetik paketi'},
  {type:'KASA',name:'ORTA KASA',price:20000,desc:'Daha geniş karakter kozmetik paketi'},
  {type:'KASA',name:'PAHALI KASA',price:30000,desc:'En kapsamlı karakter kozmetik paketi'}
];
const skinBundles=[
  {type:'SKİN KASASI',name:'UCUZ SKİN KASASI',price:1000,desc:'Skin slotları için paket'},
  {type:'SKİN KASASI',name:'ORTA SKİN KASASI',price:20000,desc:'Skin slotları için orta paket'},
  {type:'SKİN KASASI',name:'PAHALI SKİN KASASI',price:30000,desc:'Skin slotları için büyük paket'}
];

function market(){
  title.textContent='MARKET';
  content.innerHTML=`
    <div class="market-section"><div class="section-title">KARAKTER KASALARI</div><div class="market-row">${bundles.map(card).join('')}</div></div>
    <div class="market-section"><div class="section-title">SKİN KASALARI</div><div class="market-row">${skinBundles.map(card).join('')}</div></div>
    <p class="market-note">Kasa sistemi şimdilik kozmetik paket olarak hazır. İçerik ve skinleri sen daha sonra ekleyebilirsin.</p>`;
  content.querySelectorAll('.buy-card').forEach(btn=>btn.addEventListener('click',()=>{
    const price=Number(btn.dataset.price);
    if(coins<price){btn.classList.add('shake');setTimeout(()=>btn.classList.remove('shake'),300);return;}
    coins-=price; localStorage.setItem('arenaCoins',coins); coinCount.textContent=coins.toLocaleString('tr-TR');
    btn.querySelector('.buy-text').textContent='ALINDI';
  }));
}
function card(x){return `<button class="buy-card" data-price="${x.price}"><span class="crate-icon"></span><strong>${x.name}</strong><small>${x.desc}</small><span class="price"><span class="coin"></span>${x.price.toLocaleString('tr-TR')}</span><span class="buy-text">SATIN AL</span></button>`}
function simple(section){
  title.textContent=labels[section];
  if(section==='inventory') content.innerHTML='<p>Karakterlerin ve skinlerin burada görünecek.</p>';
  else if(section==='ranking') content.innerHTML='<p>Sıralama sistemi daha sonra eklenecek.</p>';
  else content.innerHTML='<p>Ayarlar burada olacak.</p>';
}

document.querySelectorAll('.menu-tabs button').forEach(button=>{
  button.addEventListener('click',()=>{
    document.querySelectorAll('.menu-tabs button').forEach(b=>b.classList.remove('active'));
    button.classList.add('active');
    button.dataset.section==='market'?market():simple(button.dataset.section);
  });
});
document.querySelector('.menu-tabs button[data-section="market"]').classList.add('active');
market();
