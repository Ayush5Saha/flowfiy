const fs = require('fs');
const leads = JSON.parse(fs.readFileSync('pipeline/picked_leads.json','utf8'));

const firstName = (n) => (n||'').trim().split(/\s+/)[0] || 'there';
const clean = (s) => (s||'').replace(/\s+/g,' ').trim();

function deriveCompany(l){
  if(l.company && l.company !== '?' && !/^null$/i.test(String(l.company))) return l.company;
  return 'your firm';
}

function vertical(l){
  const i = (l.industry||'').toLowerCase();
  const c = (l.company||'').toLowerCase();
  if(i.includes('staffing')||i.includes('recruit')||c.includes('hire')||c.includes('talent')) return 'staffing';
  if(i.includes('marketing')||i.includes('advertising')||c.includes('media')||c.includes('digital')) return 'agency';
  if(i.includes('consulting')) return 'consulting';
  return 'itservices';
}

const V = {
  itservices: {
    type:'IT Services',
    gap:'IT services firms live on a steady B2B client pipeline, but founders usually do prospecting + outreach manually between delivery work — high effort, low velocity.',
    score:8,
    hook:(co)=>`running ${co} means your pipeline depends on a steady flow of B2B clients`,
    line:'Most IT services founders I talk to are still doing outbound by hand — finding companies, writing emails, chasing follow-ups — squeezed between actual delivery work.'
  },
  agency: {
    type:'Agency',
    gap:'Marketing/advertising agencies run outbound for both their own new business AND their clients — doubly painful when done manually across Apollo + Clay + Instantly.',
    score:9,
    hook:(co)=>`at ${co} you're likely running outreach both for new clients and for the clients you serve`,
    line:'Agencies feel this twice — you need a pipeline for your own new business, and your clients want the same. Doing it manually across 3-4 tools burns hours.'
  },
  consulting: {
    type:'Consulting',
    gap:'Consulting firms rely on partner-led BD and referrals; structured outbound is usually manual and inconsistent, so pipeline is lumpy.',
    score:7,
    hook:(co)=>`consulting practices like ${co} usually grow on referrals and partner-led BD`,
    line:'Most consulting founders tell me outbound is the inconsistent part — it only happens when someone finds time between client work, so pipeline gets lumpy.'
  },
  staffing: {
    type:'Staffing',
    gap:'Staffing/recruiting firms run high-volume outreach to both clients and candidates — perfect fit for automation, usually done manually or with expensive Western tools.',
    score:9,
    hook:(co)=>`staffing firms like ${co} live on high-volume outreach — to both clients and candidates`,
    line:'Recruiting is outreach-heavy on both sides — winning client accounts AND reaching candidates. Most firms do it manually or pay a fortune for Western tools.'
  }
};

// Subject variants. For "your firm" fallback, use generic ones only.
function pickSubject(co, generic){
  const named = [
    `Quick idea for ${co}'s outbound`,
    `${co} + AI outbound (built in India)`,
    `a faster pipeline for ${co}`,
  ];
  const genericS = [
    `Quick idea for your outbound`,
    `Automating your pipeline`,
    `Saving your team hours on prospecting`,
  ];
  const pool = generic ? genericS : named.concat([`Saving your team hours on prospecting`]);
  return pool[Math.floor(Math.random()*pool.length)];
}

function emailBody(l, v, co, generic){
  const fn = firstName(l.name);
  const cityBit = (l.city && l.city !== '?') ? ` in ${l.city}` : '';
  const intro = generic
    ? `I came across your firm${cityBit} — ${v.hook(co)}.`
    : `I came across ${co}${cityBit} — ${v.hook(co)}.`;
  const body = `Hi ${fn},

${intro}

${v.line}

That's exactly why I built Flowfiy: one AI agent that finds your ideal companies, researches each one, writes a personalised cold email, and sends it — end to end in a single run. It's Claude-native, built in India, and starts at ₹1,700/mo (vs the $200-500/mo you'd spend stitching Apollo + Clay + Instantly together).

Worth a quick 15-min look? You can grab a slot at flowfiy.com — or just reply and I'll send times.

— Ayush
Founder, Flowfiy`;
  return body;
}

function whatsapp(l, co, generic){
  const fn = firstName(l.name);
  const coRef = generic ? 'your team' : co;
  return `Hi ${fn}, I'm Ayush — founder of Flowfiy. Came across ${coRef} and figured outbound is probably eating up time.

Flowfiy is an AI agent that runs your whole outbound in one go — finds companies, researches them, writes + sends personalised cold emails. Built in India, from ₹1,700/mo.

Open to a quick 15-min demo? flowfiy.com`;
}

const out = leads.map((l,idx)=>{
  const co = deriveCompany(l);
  const generic = (co === 'your firm');
  const vk = vertical(l);
  const v = V[vk];
  return {
    idx: idx+1,
    name: l.name, firstName: firstName(l.name), email: l.email,
    mobile: l.mobile || '', title: clean(l.title), company: co,
    website: l.website || '', industry: l.industry || '', companyType: v.type,
    city: (l.city && l.city!=='?')? l.city : '', state: l.state||'',
    leadSource: 'Apify', score: v.score, gap: v.gap,
    subject: pickSubject(co, generic), emailBody: emailBody(l, v, co, generic), whatsapp: whatsapp(l, co, generic)
  };
});

fs.writeFileSync('pipeline/outreach.json', JSON.stringify(out, null, 1));
console.log('Generated', out.length, 'outreach packages');
[5,15,16,48].forEach(n=>{const x=out[n-1];console.log(n+': company='+x.company+' | subj='+x.subject);});
console.log('Type breakdown:', JSON.stringify(out.reduce((a,o)=>{a[o.companyType]=(a[o.companyType]||0)+1;return a;},{})));
