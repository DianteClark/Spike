// Headless test suite for Hoshizora Spike.
// Usage: node tests/run.cjs [path/to/index.html] [--quick]
// 1) rules: thousands of simulated rallies with random tactics and substitutions, checked against volleyball rules
// 2) formations: every rotation × system × receive pattern × lineup must be overlap-legal at the serve
// 3) substitutions: the 6-per-set and re-entry rules
// 4) live: a real match in a headless browser at high speed, clicking through every huddle
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const file=process.argv.find(a=>a.endsWith('.html'))||path.join(__dirname,'..','index.html');const quick=process.argv.includes('--quick');
const HOOK='window.__T={G,P,W2,LEFT,SKILLS,STY,AXES,ALL_STY,OVL,resetBox,aiStyle,computeCourt,receiveSpots,receivers,defenseSpots,slots,overlapLegal,setSides,engServe,engAttack,applyStats,applySkill,applyPoint,cohesion,designatedSetter,setterPair,subRule,doSub,aiSubs,mkSc,teamIds};';
const src=fs.readFileSync(file,'utf8');if(!src.includes('/*TEST_HOOK*/'))throw new Error('TEST_HOOK marker missing');
const page='<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+src.replace('/*TEST_HOOK*/',HOOK)+'</body></html>';
let failed=0;const ok=(name,cond,detail)=>{console.log(`${cond?'PASS':'FAIL'}  ${name}${detail?'  '+detail:''}`);if(!cond)failed++;};

function rulesSim(o){/* runs inside the page */
  const sets=o.sets,fixed=o.fixed;
  const T=window.__T,{G,P,W2}=T,rnd=Math.random,pick=a=>a[(rnd()*a.length)|0];
  const side=(k,p)=>T.LEFT(k)?p.x<480:p.x>480;const errs=[];const chk=(c,msg)=>{if(!c&&errs.length<25)errs.push(msg);};
  const S={serves:0,aces:0,se:0,att:0,k:0,e:0,stuff:0,dug:0,rallies:0,sideout:0,q:[0,0,0,0],types:{},sets:{us:0,them:0},pts:0,dumps:0,subs:0};
  for(const id in P)Object.assign(P[id],{sp:20,lock:false,held:0,sta:100});T.resetBox();G.sc={us:T.mkSc(),them:T.mkSc()};G.scs={us:T.mkSc(),them:T.mkSc()};G.flows=[];G.playing=true;
  const benchSwap={us:[['haru','aoi'],['sora','tsubasa'],['ren','tsubasa']],them:[['kenji','nagi'],['go','ban'],['jin','ban']]};
  for(let set=0;set<sets;set++){
    for(const k of ['us','them']){const t=G.T[k];t.start=t.start0.slice();if(rnd()<.35){const [o,i]=pick(benchSwap[k]);t.start[t.start.indexOf(o)]=i;}
      t.sty=fixed?{...fixed[k]}:Object.fromEntries(T.AXES.map(ax=>[ax,pick(T.STY[ax])]));if(fixed){t.start=t.start0.slice();for(const [x,y] of (o.swap&&o.swap[k])||[])t.start[t.start.indexOf(x)]=y;}
      Object.assign(t,{score:0,streak:0,lineup:t.start.slice(),setStart:t.start.slice(),adjust:0,subs:0,pair:{},used:new Set(),reent:new Set(),outed:new Set(),to:2});}
    G.serving=rnd()<.5?'us':'them';G.buff={us:0,them:0};G.flows.push({set,pts:[],marks:[]});
    T.setSides(set%2===0);
    while(true){
      const a=G.T.us.score,b=G.T.them.score;if((a>=25||b>=25)&&Math.abs(a-b)>=2)break;
      G.rallyAttacks=0;G.rallySkills=0;G.rallyUsed=[];
      // random mid-set substitutions, both directions, must respect the rules
      if(!fixed&&rnd()<.06){const k=pick(['us','them']),t=G.T[k],ins=T.teamIds(k).filter(id=>id!==t.libero&&!t.lineup.includes(id)),inn=ins.length&&pick(ins),out=pick(t.lineup);
        if(inn&&!T.subRule(k,out,inn)){T.doSub(k,out,inn);S.subs++;chk(t.subs<=6,'more than 6 subs');}}
      if(!fixed&&rnd()<.03){const k=pick(['us','them']);const ax=pick(T.AXES);G.T[k].sty={...G.T[k].sty,[ax]:pick(T.STY[ax])};}
      T.computeCourt('us');T.computeCourt('them');
      for(const k of ['us','them']){const ids=G.court[k];chk(new Set(ids).size===6,'dup on court '+k);
        chk(ids.filter(id=>P[id].pos==='L').length<=1,'two liberos');chk(ids.every(id=>P[id].team===k),'wrong team on court');
        const sl=T.slots(k);chk(new Set(ids.map(id=>sl[id].row+sl[id].slot)).size===6,'slot collision '+k);
        const rs=T.receiveSpots(k),ds=T.defenseSpots(k,null,0),ds2=T.defenseSpots(k,[],2);
        for(const id of ids)for(const l of [rs[id],ds[id],ds2[id]])chk(l[0]>=0&&l[0]<=9.6&&l[1]>=-.5&&l[1]<=9.5&&side(k,W2(k,l)),`${id} off court ${l}`);
        const d=T.designatedSetter(k);if(d)chk(ids.includes(d),'designated setter not on court');}
      const sk=G.serving,rk=sk==='us'?'them':'us';chk(P[G.court[sk][0]].pos!=='L','libero serving');
      chk(T.overlapLegal(rk,T.receiveSpots(rk)),'OVERLAP '+rk+' '+G.T[rk].sty.sys+'/'+G.T[rk].sty.rcv+' '+G.T[rk].lineup.join(','));
      let st=T.engServe();S.serves++;const all=[...st.ev];while(st.next){st=T.engAttack(st.next);all.push(...st.ev);}
      let w=null;
      for(const e of all){T.applyStats(e);
        if(e.t==='serve'){if(e.res==='ace')S.aces++;if(e.res==='net'||e.res==='out'||e.res==='foot')S.se++;
          if(e.res==='in'||e.res==='ace'){chk(e.to[0]!==e.k,'serve lands on own side');chk(P[e.passer].team===e.to[0],'passer team');chk(T.receivers(e.to[0]).includes(e.passer),'passer not in receive pattern');}}
        if(e.t==='pass'){if(e.libSet)chk(e.tgt[0]>=3.5,'libero front-zone set');chk(P[e.player].team===e.k&&P[e.setter].team===e.k,'pass team');chk(e.setter!==e.player,'same player twice');if(e.kind==='pass')S.q[e.q]++;}
        if(e.t==='set'&&!e.fault){chk(P[e.hitter].team===e.k,'hitter team');chk(P[e.hitter].pos!=='L'||e.type==='free','libero attacks');
          for(const b of e.blockers){chk(P[b].team!==e.k,'blocker same team');chk(T.slots(P[b].team)[b].row==='front','back-row blocker');}
          const s=T.slots(e.k)[e.hitter];if(e.type==='pipe'||e.type==='back')chk(s.row==='back','back attack by front row');
          if(['left','right','quick','dump'].includes(e.type))chk(s.row==='front','front attack by back-row player '+e.hitter+' '+e.type);
          if(e.type==='dump'){S.dumps++;chk(e.hitter===e.setter,'dump by non-setter');}
          S.types[e.type]=(S.types[e.type]||0)+1;}
        if(e.t==='attack'&&e.type!=='free'){S.att++;const dk=e.k==='us'?'them':'us';
          if(e.res==='kill'||e.res==='dug'){chk(e.land[0]===dk&&side(dk,W2(...e.land)),'land side');chk(P[e.digger].team===dk,'digger team');}
          if(e.res==='kill')S.k++;if(e.res==='net'||e.res==='out')S.e++;if(e.res==='stuff')S.stuff++;if(e.res==='dug')S.dug++;}
        if(e.t==='skill')T.applySkill(e);if(e.t==='point')w=e.w;}
      chk(w,'no winner');S.rallies++;if(w!==sk)S.sideout++;S.pts++;T.applyPoint(w);
      for(const id in P)if(!G.court.us.includes(id)&&!G.court.them.includes(id))P[id].sta=Math.min(100,P[id].sta);
    }
    S.sets[G.T.us.score>G.T.them.score?'us':'them']++;for(const id in P)P[id].sta=100;
  }
  const pct=(a,b)=>+(100*a/b).toFixed(1);
  return {errs,aces:pct(S.aces,S.serves),servErr:pct(S.se,S.serves),pass:S.q.map(x=>pct(x,S.q.reduce((s,v)=>s+v,0))),kill:pct(S.k,S.att),err:pct(S.e,S.att),stuff:pct(S.stuff,S.att),
    hit:+((S.k-S.e-S.stuff)/S.att).toFixed(3),sideout:pct(S.sideout,S.rallies),attPerRally:+(S.att/S.rallies).toFixed(2),types:S.types,dumps:S.dumps,subs:S.subs,sets:S.sets};}

function formationSweep(){const T=window.__T,{G,P}=window.__T,bad=[];let n=0;
  const variants={us:[[],[['haru','aoi']],[['sora','tsubasa']],[['haru','aoi'],['ren','tsubasa']],[['kaito','aoi']]],them:[[],[['kenji','nagi']],[['go','ban']],[['kenji','nagi'],['jin','ban']]]};
  for(const k of ['us','them'])for(const v of variants[k]){const t=G.T[k];const base=t.start0.slice();for(const [o,i] of v)base[base.indexOf(o)]=i;
    for(let r=0;r<6;r++)for(const serving of [k,k==='us'?'them':'us'])for(const sys of T.STY.sys)for(const rcv of T.STY.rcv)for(const dfm of T.STY.dfm){
      t.lineup=base.slice(r).concat(base.slice(0,r));G.serving=serving;t.sty={...t.sty,sys,rcv,dfm};T.computeCourt(k);n++;
      const m=T.receiveSpots(k);if(!T.overlapLegal(k,m))bad.push(`${k} ${v.map(x=>x[1]).join('+')||'base'} rot${r} ${sys} ${rcv}`);
      const pass=T.receivers(k);if(pass.length!==Math.min({r2:2,r3:3,r4:4,r5:5}[rcv],5))bad.push('receiver count '+rcv);
      for(const bly of [.9,4.5,8.1]){const sl=T.slots(k),fr=G.court[k].filter(id=>sl[id].row==='front').slice(0,2),d=T.defenseSpots(k,fr,bly);
        const pts=Object.values(d);for(let a=0;a<pts.length;a++)for(let b=a+1;b<pts.length;b++)if(Math.hypot(pts[a][0]-pts[b][0],pts[a][1]-pts[b][1])<.5)bad.push(`stacked defenders ${k} ${dfm} rot${r}`);}}
    t.lineup=t.start0.slice();t.sty={...t.sty,sys:'51'};}
  return {n,bad:[...new Set(bad)].slice(0,12)};}

function subTests(){const T=window.__T,{G}=T,t=G.T.us,r=[];const reset=()=>{Object.assign(t,{lineup:t.start0.slice(),start:t.start0.slice(),setStart:t.start0.slice(),subs:0,pair:{},used:new Set(),reent:new Set(),outed:new Set()});};
  reset();r.push(['sub in a bench player',T.subRule('us','haru','aoi')==='']);T.doSub('us','haru','aoi');
  r.push(['starter returns only for their replacement',T.subRule('us','sora','haru')!==''&&T.subRule('us','aoi','haru')==='']);
  r.push(['a sub cannot be replaced by another bench player',T.subRule('us','aoi','tsubasa')!=='']);
  T.doSub('us','aoi','haru');r.push(['re-entry recorded',t.lineup.includes('haru')&&t.subs===2]);
  r.push(['a starter who returned cannot leave again',T.subRule('us','haru','tsubasa')!=='']);
  r.push(['a sub cannot enter twice',T.subRule('us','sora','aoi')!=='']);
  r.push(['libero is never substituted',T.subRule('us','yui','tsubasa')!==''&&T.subRule('us','kaito','yui')!=='']);
  reset();t.subs=6;r.push(['six substitutions per set',T.subRule('us','sora','tsubasa')!=='']);reset();
  return r;}

(async()=>{
  const b=await chromium.launch();
  {const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e)));await pg.setContent(page);await pg.waitForTimeout(200);
    const fs_=await pg.evaluate(formationSweep);ok(`formations: ${fs_.n} rotation × system × receive × lineup states overlap-legal`,!fs_.bad.length,fs_.bad.join(' | '));
    for(const [n,c] of await pg.evaluate(subTests))ok('subs: '+n,c);
    const r=await pg.evaluate(rulesSim,{sets:quick?12:60});ok(`rules: simulated sets with random tactics and subs`,!r.errs.length,r.errs.join(' | '));
    console.log('      stats',JSON.stringify({aces:r.aces,servErr:r.servErr,pass:r.pass,kill:r.kill,err:r.err,stuff:r.stuff,hit:r.hit,sideout:r.sideout,att:r.attPerRally,dumps:r.dumps,subs:r.subs,types:r.types}));
    ok('stats: kill rate in a realistic band (35–55%)',r.kill>=35&&r.kill<=55,r.kill+'%');ok('stats: sideout rate realistic (52–70%)',r.sideout>=52&&r.sideout<=70,r.sideout+'%');
    ok('rules page: no script errors',!errs.length,errs.join(' | '));await pg.close();}
  for(const vp of [{width:1366,height:768},{width:390,height:760}]){const pg=await b.newPage({viewport:vp});const errs=[];pg.on('pageerror',e=>errs.push(String(e)));
    await pg.setContent(page);await pg.waitForTimeout(300);
    await pg.click('#tab-lineup');await pg.click('#tab-scout');await pg.click('#tab-tac');await pg.click('label[for=st-62]');await pg.click('label[for=st-51]');
    await pg.click('label[for=f1]');await pg.click('#startBtn');await pg.waitForTimeout(400);await pg.evaluate('__T.G.speed=30');
    let huddles=0,cross=0,final=false;const t0=Date.now(),limit=quick?45000:120000;
    while(Date.now()-t0<limit){await pg.waitForTimeout(200);
      const st=await pg.evaluate(`(()=>{const {G,P}=__T;let c=0;if(!G.replaying)for(const k of ['us','them'])for(const id of G.court[k]){const p=P[id];if(__T.LEFT(k)?p.x>482:p.x<478)c++;}
        const sh=document.getElementById('sheet');return [c,sh.hidden?'':document.getElementById('startBtn').textContent];})()`);
      cross+=st[0];
      if(st[1]==='Rematch'){final=true;break;}
      if(st[1]&&st[1]!=='Start the match'){huddles++;await pg.click('#tab-scout');const btn=await pg.$('#insList button:not([disabled])');if(btn)await btn.click();
        await pg.click('#tab-lineup');const sel=await pg.$('#bench select');if(sel){const v=await sel.evaluate(s=>s.options[1]&&s.options[1].value);if(v)await sel.selectOption(v);}
        await pg.click('#startBtn');}
      else if(huddles===0&&!(await pg.evaluate('__T.G.toQueue'))&&(await pg.evaluate('__T.G.T.us.to'))>0)await pg.evaluate(()=>document.getElementById('toBtn').click());}
    ok(`live ${vp.width}x${vp.height}: match reached the final`,final);ok(`live ${vp.width}x${vp.height}: huddles worked`,huddles>=1,huddles+' huddles');
    ok(`live ${vp.width}x${vp.height}: nobody crossed the net`,cross===0,cross+' frames');ok(`live ${vp.width}x${vp.height}: no script errors`,!errs.length,errs.slice(0,3).join(' | '));
    const fit=await pg.evaluate(()=>{const d=document.documentElement;return d.scrollHeight<=innerHeight&&d.scrollWidth<=innerWidth;});ok(`live ${vp.width}x${vp.height}: single screen, no page scroll`,fit);
    await pg.close();}
  await b.close();console.log(failed?`\n${failed} check(s) failed`:'\nAll checks passed');process.exit(failed?1:0);
})().catch(e=>{console.error(e);process.exit(1);});

