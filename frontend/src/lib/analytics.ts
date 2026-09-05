const STORAGE_VISITOR='pluten:visitor-id';
const STORAGE_SESSION='pluten:session-id';

function uuid(){return crypto.randomUUID();}
function getId(key:string,storage:Storage){let value=storage.getItem(key);if(!value){value=uuid();storage.setItem(key,value);}return value;}

export function getAnalyticsIdentity(){
  if(typeof window==='undefined') return null;
  return {visitorId:getId(STORAGE_VISITOR,window.localStorage),sessionId:getId(STORAGE_SESSION,window.sessionStorage)};
}

export async function trackAnalytics(type:'PAGE_VIEW'|'SESSION_HEARTBEAT'|'PRODUCT_VIEWED'|'PORTFOLIO_VIEWED',path?:string){
  if(typeof window==='undefined') return;
  const identity=getAnalyticsIdentity();if(!identity)return;
  const query=new URLSearchParams(window.location.search);
  const body={type,path:path||window.location.pathname+window.location.search,visitorId:identity.visitorId,sessionId:identity.sessionId,utmSource:query.get('utm_source'),utmMedium:query.get('utm_medium'),utmCampaign:query.get('utm_campaign')};
  try{await fetch(`${(process.env.NEXT_PUBLIC_API_URL||'').replace(/\/+$/,'')}/analytics/track`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true});}catch(_e){}
}
