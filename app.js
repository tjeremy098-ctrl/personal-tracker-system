(function(){
var CATS={Food:"#e07a3f",Transport:"#3b82c4",Housing:"#8b6bd0",Bills:"#d0507f",Health:"#2fa383",Fun:"#e9a82a",Shopping:"#7fa63a",Other:"#8c98a4"};
var KEY="tevoh-tracker-v1";
var S=load();
var ui={month:"cur",cat:"all"};
function blank(){return{cur:"KSh",expenses:[],wishes:[],goals:[]}}
function load(){try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);if(d&&d.expenses&&d.wishes&&d.goals)return d}}catch(e){}return blank()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){var n=document.getElementById("note");if(n)n.textContent="Browser storage is unavailable, so changes won’t persist after you close this page."}}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function today(){var d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function money(n){return S.cur+" "+Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})}
function sum(a,f){return a.reduce(function(t,x){return t+f(x)},0)}
function ym(d){return d.slice(0,7)}
function mlabel(m){var p=m.split("-");return new Date(+p[0],+p[1]-1,1).toLocaleDateString(undefined,{month:"long",year:"numeric"})}
function dlabel(d){var p=d.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}
function goalSaved(g){return sum(g.deposits,function(x){return x.amt})}
function totalSaved(){return sum(S.goals,goalSaved)}
function pct(a,b){return b>0?Math.max(0,Math.min(100,a/b*100)):0}

function overview(){
  var cm=ym(today()),all=sum(S.expenses,function(e){return e.amt});
  var mon=S.expenses.filter(function(e){return ym(e.date)===cm});
  var mt=sum(mon,function(e){return e.amt}),saved=totalSaved(),wish=sum(S.wishes,function(w){return w.cost});
  var by={};mon.forEach(function(e){by[e.cat]=(by[e.cat]||0)+e.amt});
  var cats=Object.keys(by).sort(function(a,b){return by[b]-by[a]});
  var head,sub;
  if(!S.expenses.length&&!S.goals.length&&!S.wishes.length){head="Start by logging your first expense or setting a savings goal.";sub="Everything you add here shows up on this page."}
  else if(wish>0){var c=pct(saved,wish);head=c>=100?"Your savings cover your whole wishlist.":"Your savings cover "+Math.round(c)+"% of your wishlist.";sub=c>=100?"You could buy everything on your list and still have "+money(saved-wish)+" left.":"You need "+money(wish-saved)+" more to buy everything on your list."}
  else{head="You’ve spent "+money(mt)+" this month.";sub="You have "+money(saved)+" saved across "+S.goals.length+" goal"+(S.goals.length===1?"":"s")+"."}
  var seg=cats.length?'<div class="seg" role="img" aria-label="This month’s spending by category">'+cats.map(function(c){return'<i style="width:'+by[c]/mt*100+'%;background:'+CATS[c]+'" title="'+c+'"></i>'}).join("")+'</div><div class="legend">'+cats.map(function(c){return'<span style="--c:'+CATS[c]+'">'+c+" "+money(by[c])+"</span>"}).join("")+"</div>":'<div class="seg"></div><div class="legend"><span style="--c:rgba(255,255,255,.4)">No expenses logged this month</span></div>';
  var recent=S.expenses.slice().sort(function(a,b){return b.date.localeCompare(a.date)}).slice(0,5);
  return'<section class="hero"><h2>'+head+'</h2><p>'+sub+'</p>'+seg+'</section>'+
  '<div class="grid">'+
  stat("Total expenses",money(all),S.expenses.length+" entries")+
  stat("Spent this month",money(mt),mlabel(cm))+
  stat("Current savings",money(saved),S.goals.length+" goals")+
  stat("Wishlist total",money(wish),S.wishes.length+" items")+'</div>'+
  '<div class="card"><h3>Recent expenses</h3>'+(recent.length?'<ul class="list">'+recent.map(expRow.bind(null,false)).join("")+"</ul>":'<p class="empty">No expenses yet. Add one in the Expenses tab.</p>')+"</div>";
}
function stat(l,v,s){return'<div class="card stat"><div class="l">'+l+'</div><div class="v">'+v+'</div><div class="s">'+s+"</div></div>"}
function expRow(del,e){return'<li><span class="dot" style="--c:'+CATS[e.cat]+'"></span><div class="grow"><b>'+esc(e.note||e.cat)+"</b><small>"+e.cat+" · "+dlabel(e.date)+'</small></div><span class="amt">'+money(e.amt)+"</span>"+(del?'<button class="btn del sm" data-act="delexp" data-id="'+e.id+'" aria-label="Delete expense">Delete</button>':"")+"</li>"}

function expenses(){
  var months={};months[ym(today())]=1;S.expenses.forEach(function(e){months[ym(e.date)]=1});
  var ml=Object.keys(months).sort().reverse();
  var m=ui.month==="cur"?ym(today()):ui.month;
  var list=S.expenses.filter(function(e){return(m==="all"||ym(e.date)===m)&&(ui.cat==="all"||e.cat===ui.cat)}).sort(function(a,b){return b.date.localeCompare(a.date)});
  return'<div class="sec-head"><h2>Expenses</h2><div class="tot">Showing <b>'+money(sum(list,function(e){return e.amt}))+"</b></div></div>"+
  '<div class="card"><form class="add" id="fexp"><div><label for="ea">Amount</label><input id="ea" type="number" min="0.01" step="0.01" inputmode="decimal" required></div>'+
  '<div><label for="ed">Date</label><input id="ed" type="date" value="'+today()+'" required></div>'+
  '<div><label for="ec">Category</label><select id="ec">'+Object.keys(CATS).map(function(c){return"<option>"+c+"</option>"}).join("")+"</select></div>"+
  '<div><label for="en">Note (optional)</label><input id="en" maxlength="60" placeholder="e.g. Lunch"></div><button class="btn" type="submit">Add expense</button></form></div>'+
  '<div class="filters"><select id="fm" aria-label="Month"><option value="all"'+(m==="all"?" selected":"")+'>All time</option>'+ml.map(function(x){return'<option value="'+x+'"'+(m===x?" selected":"")+">"+mlabel(x)+"</option>"}).join("")+"</select>"+
  '<select id="fc" aria-label="Category"><option value="all">All categories</option>'+Object.keys(CATS).map(function(c){return"<option"+(ui.cat===c?" selected":"")+">"+c+"</option>"}).join("")+"</select></div>"+
  '<div class="card">'+(list.length?'<ul class="list">'+list.map(expRow.bind(null,true)).join("")+"</ul>":'<p class="empty">No expenses match. Add one above or change the filters.</p>')+"</div>";
}

function wishlist(){
  var tot=sum(S.wishes,function(w){return w.cost}),saved=totalSaved();
  return'<div class="sec-head"><h2>Wishlist</h2><div class="tot">Total cost <b>'+money(tot)+"</b></div></div>"+
  '<div class="card"><form class="add" id="fwish"><div style="grid-column:span 2"><label for="wn">Item</label><input id="wn" maxlength="60" required placeholder="e.g. Noise-cancelling headphones"></div>'+
  '<div><label for="wc">Estimated cost</label><input id="wc" type="number" min="0.01" step="0.01" inputmode="decimal" required></div><button class="btn" type="submit">Add to wishlist</button></form></div>'+
  '<div class="card" style="margin-top:12px">'+(S.wishes.length?'<ul class="list">'+S.wishes.map(function(w){
    var c=pct(saved,w.cost);
    return'<li><div class="grow"><b>'+esc(w.name)+"</b><small>"+(saved>=w.cost?"Your savings cover this":Math.round(c)+"% covered by savings")+'</small></div><span class="amt">'+money(w.cost)+'</span><button class="btn ghost sm" data-act="bought" data-id="'+w.id+'" title="Removes it and logs the cost as a Shopping expense">Bought</button><button class="btn del sm" data-act="delwish" data-id="'+w.id+'" aria-label="Remove item">Remove</button></li>'}).join("")+"</ul>":'<p class="empty">Nothing here yet. Add something you want to buy.</p>')+"</div>";
}

function chart(){
  var pts=[];S.goals.forEach(function(g){g.deposits.forEach(function(d){pts.push(d)})});
  pts.sort(function(a,b){return a.date.localeCompare(b.date)});
  if(pts.length<2)return'<p class="empty">Add at least two deposits to see your savings grow over time.</p>';
  var run=0,v=pts.map(function(p){run+=p.amt;return run}),mx=Math.max.apply(null,v),mn=Math.min(0,Math.min.apply(null,v)),r=(mx-mn)||1;
  var W=600,H=150,x=function(i){return 10+i*(W-20)/(v.length-1)},y=function(n){return H-10-(n-mn)/r*(H-30)};
  var d=v.map(function(n,i){return(i?"L":"M")+x(i).toFixed(1)+" "+y(n).toFixed(1)}).join(" ");
  return'<svg class="chart" viewBox="0 0 600 175" role="img" aria-label="Cumulative savings over time"><path class="ar" d="'+d+" L"+x(v.length-1)+" "+(H-10)+" L10 "+(H-10)+' Z"/><path class="ln" d="'+d+'"/><text x="10" y="170">'+dlabel(pts[0].date)+'</text><text x="590" y="170" text-anchor="end">'+dlabel(pts[pts.length-1].date)+"</text></svg>";
}
function savings(){
  return'<div class="sec-head"><h2>Savings</h2><div class="tot">Total saved <b>'+money(totalSaved())+"</b></div></div>"+
  '<div class="card"><form class="add" id="fgoal"><div><label for="gn">Goal name</label><input id="gn" maxlength="50" required placeholder="e.g. Emergency fund"></div>'+
  '<div><label for="gt">Target amount</label><input id="gt" type="number" min="1" step="0.01" inputmode="decimal" required></div><button class="btn" type="submit">Create goal</button></form></div>'+
  '<div class="card" style="margin:12px 0"><h3 style="margin-bottom:8px">Progress over time</h3>'+chart()+"</div>"+
  (S.goals.length?S.goals.map(goal).join(""):'<p class="empty">No goals yet. Create one above to start tracking.</p>');
}
function goal(g){
  var s=goalSaved(g),p=pct(s,g.target),h=g.deposits.slice().sort(function(a,b){return b.date.localeCompare(a.date)}).slice(0,5);
  return'<div class="card goal"><div class="row"><h3>'+esc(g.name)+"</h3><span class=\"amt\">"+money(s)+" of "+money(g.target)+'</span></div><div class="bar'+(p>=100?" done":"")+'" role="progressbar" aria-valuenow="'+Math.round(p)+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+p+'%"></i></div>'+
  '<small style="color:var(--muted)">'+(p>=100?"Goal reached!":Math.round(p)+"% done · "+money(g.target-s)+" to go")+"</small>"+
  '<form class="dep" data-act="dep" data-id="'+g.id+'"><input type="number" step="0.01" inputmode="decimal" required placeholder="Amount (negative to withdraw)" aria-label="Deposit amount"><button class="btn" type="submit">Update</button></form>'+
  "<details><summary>Edit goal and history</summary><form class=\"sub\" data-act=\"edit\" data-id=\""+g.id+'"><div><label>Name</label><input value="'+esc(g.name)+'" maxlength="50" required></div><div><label>Target</label><input type="number" min="1" step="0.01" value="'+g.target+'" required></div><button class="btn sm" type="submit">Save</button></form>'+
  (h.length?'<ul class="list hist">'+h.map(function(d){return"<li><div class=\"grow\">"+dlabel(d.date)+'</div><span class="amt">'+(d.amt<0?"−":"+")+money(Math.abs(d.amt))+'</span><button class="btn del sm" data-act="deldep" data-id="'+g.id+'" data-d="'+d.id+'" aria-label="Delete entry">Delete</button></li>'}).join("")+"</ul>":"")+
  '<button class="btn del sm" data-act="delgoal" data-id="'+g.id+'" type="button">Delete goal</button></details></div>';
}

var views={overview:overview,expenses:expenses,savings:savings,wishlist:wishlist};
function tab(){var h=location.hash.slice(1);return views[h]?h:"overview"}
function render(){
  var t=tab();
  document.getElementById("main").innerHTML=views[t]();
  document.querySelectorAll("nav.tabs a").forEach(function(a){if(a.dataset.t===t)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  document.getElementById("cur").value=S.cur;
}
function commit(){save();render()}
window.addEventListener("hashchange",function(){render();window.scrollTo(0,0)});
document.getElementById("cur").addEventListener("change",function(e){S.cur=e.target.value;commit()});
document.getElementById("reset").addEventListener("click",function(){
  if(this.dataset.arm){S=blank();this.dataset.arm="";this.textContent="Clear all data";commit();return}
  this.dataset.arm="1";this.textContent="Tap again to confirm";
  var b=this;setTimeout(function(){b.dataset.arm="";b.textContent="Clear all data"},4000);
});
document.getElementById("main").addEventListener("change",function(e){
  if(e.target.id==="fm"){ui.month=e.target.value;render()}
  if(e.target.id==="fc"){ui.cat=e.target.value;render()}
});
document.getElementById("main").addEventListener("click",function(e){
  var b=e.target.closest("[data-act]");if(!b||b.tagName==="FORM")return;
  var a=b.dataset.act,id=b.dataset.id;
  if(a==="delexp")S.expenses=S.expenses.filter(function(x){return x.id!==id});
  else if(a==="delwish")S.wishes=S.wishes.filter(function(x){return x.id!==id});
  else if(a==="bought"){var w=S.wishes.filter(function(x){return x.id===id})[0];if(w){S.expenses.push({id:uid(),amt:w.cost,date:today(),cat:"Shopping",note:w.name});S.wishes=S.wishes.filter(function(x){return x.id!==id})}}
  else if(a==="delgoal"){S.goals=S.goals.filter(function(x){return x.id!==id})}
  else if(a==="deldep"){S.goals.forEach(function(g){if(g.id===id)g.deposits=g.deposits.filter(function(d){return d.id!==b.dataset.d})})}
  else return;
  commit();
});
document.getElementById("main").addEventListener("submit",function(e){
  e.preventDefault();var f=e.target,v=function(i){return document.getElementById(i).value};
  if(f.id==="fexp"){S.expenses.push({id:uid(),amt:+v("ea"),date:v("ed"),cat:v("ec"),note:v("en").trim()})}
  else if(f.id==="fwish"){S.wishes.push({id:uid(),name:v("wn").trim(),cost:+v("wc")})}
  else if(f.id==="fgoal"){S.goals.push({id:uid(),name:v("gn").trim(),target:+v("gt"),deposits:[]})}
  else if(f.dataset.act==="dep"){var n=+f.querySelector("input").value;if(!n)return;S.goals.forEach(function(g){if(g.id===f.dataset.id)g.deposits.push({id:uid(),amt:n,date:today()})})}
  else if(f.dataset.act==="edit"){var i=f.querySelectorAll("input");S.goals.forEach(function(g){if(g.id===f.dataset.id){g.name=i[0].value.trim();g.target=+i[1].value}})}
  else return;
  commit();
});
render();
})();
