const fs=require('fs');const R='C:/Users/Sageer/Desktop/Challenges/designxp/data/';
const norm=s=>s.replace(/\s+/g,' ').trim();
const map=new Map();
for(const q of JSON.parse(fs.readFileSync(R+'source-questions.json','utf8'))){const t=q.options.filter(o=>o.key===q.answer).map(o=>norm(o.text));map.set(norm(q.question),t);}
for(const q of JSON.parse(fs.readFileSync(R+'original-questions.json','utf8'))){const t=q.options.filter(o=>q.correctAnswers.includes(o.key)).map(o=>norm(o.text));map.set(norm(q.question),t);}
module.exports={map,norm};
