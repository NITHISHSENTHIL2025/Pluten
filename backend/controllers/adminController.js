const prisma = require('../lib/prisma');

const parsePagination = (req) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

const startOfIndiaDay = (daysAgo = 0) => {
  const now = new Date();
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const base = new Date(`${day}T00:00:00+05:30`);
  base.setUTCDate(base.getUTCDate() - daysAgo);
  return base;
};

const getWindow = (rawRange) => {
  const range = ['today', '7d', '30d', '90d'].includes(String(rawRange)) ? String(rawRange) : '30d';
  const now = new Date();
  let start;
  if (range === 'today') start = startOfIndiaDay(0);
  else if (range === '7d') start = startOfIndiaDay(6);
  else if (range === '90d') start = startOfIndiaDay(89);
  else start = startOfIndiaDay(29);
  return { range, start, end: now };
};

const money = (v) => Number(v || 0);
const percent = (value, total) => total > 0 ? Number(((value / total) * 100).toFixed(2)) : 0;
const delta = (current, previous) => previous > 0 ? Number((((current - previous) / previous) * 100).toFixed(1)) : (current > 0 ? 100 : 0);

async function scalar(sql, ...params) {
  const rows = await prisma.$queryRaw(sql(...params));
  return Number(rows?.[0]?.value || 0);
}

async function buildMetrics(start, end) {
  const previousDuration = end.getTime() - start.getTime();
  const previousStart = new Date(start.getTime() - previousDuration);

  const todayStart=startOfIndiaDay(0); const [revenue, previousRevenue, orders, previousOrders, newCustomers, previousCustomers, productViews, uniqueVisitors, returningVisitors, liveVisitors, portfolioCreated, portfolioPublished, repeatCustomers, failedPayments, pendingOrders, totalUsers, premiumUsers, todayRevenue, todayOrders, todayProductViews, todayPortfolios] = await Promise.all([
    scalar((s,e)=>prisma.$queryRaw`SELECT COALESCE(SUM("totalAmount"),0)::numeric AS value FROM "Order" WHERE "status"='SUCCESS' AND "createdAt">=${s} AND "createdAt"<${e}`, start, end),
    scalar((s,e)=>prisma.$queryRaw`SELECT COALESCE(SUM("totalAmount"),0)::numeric AS value FROM "Order" WHERE "status"='SUCCESS' AND "createdAt">=${s} AND "createdAt"<${e}`, previousStart, start),
    prisma.order.count({ where: { status: 'SUCCESS', createdAt: { gte: start, lt: end } } }),
    prisma.order.count({ where: { status: 'SUCCESS', createdAt: { gte: previousStart, lt: start } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: start, lt: end } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: previousStart, lt: start } } }),
    prisma.analyticsEvent.count({ where: { type: 'PRODUCT_VIEWED', createdAt: { gte: start, lt: end } } }),
    scalar((s,e)=>prisma.$queryRaw`SELECT COUNT(DISTINCT "visitorId")::int AS value FROM "AnalyticsEvent" WHERE type='PAGE_VIEW' AND "createdAt">=${s} AND "createdAt"<${e}`, start, end),
    scalar((s,e)=>prisma.$queryRaw`SELECT COUNT(DISTINCT e."visitorId")::int AS value FROM "AnalyticsEvent" e WHERE e.type='PAGE_VIEW' AND e."createdAt">=${s} AND e."createdAt"<${e} AND EXISTS (SELECT 1 FROM "AnalyticsEvent" old WHERE old.type='PAGE_VIEW' AND old."visitorId"=e."visitorId" AND old."createdAt"<${s})`, start, end),
    prisma.analyticsSession.count({ where: { lastSeen: { gte: new Date(Date.now() - 90000) } } }),
    prisma.portfolio.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.portfolio.count({ where: { publishedAt: { gte: start, lt: end }, status: 'PUBLISHED' } }),
    scalar((s,e)=>prisma.$queryRaw`SELECT COUNT(*)::int AS value FROM (SELECT "userId" FROM "Order" WHERE "status"='SUCCESS' GROUP BY "userId" HAVING COUNT(*)>1) x`, start, end),
    prisma.order.count({ where: { status: 'FAILED', createdAt: { gte: start, lt: end } } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'CUSTOMER', isPremium: true } }),
    scalar((s,e)=>prisma.$queryRaw`SELECT COALESCE(SUM("totalAmount"),0)::numeric AS value FROM "Order" WHERE "status"='SUCCESS' AND "createdAt">=${s} AND "createdAt"<${e}`, todayStart, end),
    prisma.order.count({ where:{status:'SUCCESS',createdAt:{gte:todayStart,lt:end}} }),
    prisma.analyticsEvent.count({ where:{type:'PRODUCT_VIEWED',createdAt:{gte:todayStart,lt:end}} }),
    prisma.portfolio.count({ where:{createdAt:{gte:todayStart,lt:end}} }),
  ]);

  // repeatCustomers is lifetime, which is intentional: it measures relationship depth, not period sales.
  return {
    revenue: money(revenue), previousRevenue: money(previousRevenue), revenueDelta: delta(money(revenue), money(previousRevenue)),
    orders, previousOrders, orderDelta: delta(orders, previousOrders),
    newCustomers, previousCustomers, customerDelta: delta(newCustomers, previousCustomers),
    productViews, uniqueVisitors, returningVisitors, returningRate: percent(returningVisitors, uniqueVisitors),
    liveVisitors, portfolioCreated, portfolioPublished, repeatCustomers,
    failedPayments, pendingOrders, totalUsers, premiumUsers,
    averageOrderValue: orders ? Number((money(revenue) / orders).toFixed(2)) : 0,
    viewToPurchase: percent(orders, productViews),
    todayRevenue: money(todayRevenue), todayOrders, todayProductViews, todayPortfolios,
  };
}

async function getOverview(req, res) {
  try {
    const { range, start, end } = getWindow(req.query.range);
    const [metrics, revenueSeries, topProducts, devices, sources, countries, funnel, recentOrders, suspiciousDownloads, topConvertingProducts, missingDigitalAssets] = await Promise.all([
      buildMetrics(start, end),
      prisma.$queryRaw`SELECT TO_CHAR((("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata'),'YYYY-MM-DD') AS day, COALESCE(SUM("totalAmount"),0)::numeric AS revenue, COUNT(*)::int AS orders FROM "Order" WHERE "status"='SUCCESS' AND "createdAt">=${start} AND "createdAt"<${end} GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw`SELECT p.id,p.title,COUNT(o.id)::int AS orders,COALESCE(SUM(o."totalAmount"),0)::numeric AS revenue FROM "Product" p LEFT JOIN "Order" o ON o."productId"=p.id AND o."status"='SUCCESS' AND o."createdAt">=${start} AND o."createdAt"<${end} GROUP BY p.id,p.title ORDER BY orders DESC,revenue DESC LIMIT 10`,
      prisma.$queryRaw`SELECT "deviceType" AS device,COUNT(*)::int AS value FROM "AnalyticsEvent" WHERE type='PAGE_VIEW' AND "createdAt">=${start} AND "createdAt"<${end} GROUP BY "deviceType" ORDER BY value DESC`,
      prisma.$queryRaw`SELECT COALESCE(NULLIF(s."utmSource",''),'Direct') AS source,COUNT(*)::int AS value FROM "AnalyticsSession" s WHERE s."firstSeen">=${start} AND s."firstSeen"<${end} GROUP BY 1 ORDER BY value DESC LIMIT 10`,
      prisma.$queryRaw`SELECT COALESCE(NULLIF("country",''),'Unknown') AS country,COUNT(DISTINCT "visitorId")::int AS value FROM "AnalyticsEvent" WHERE type='PAGE_VIEW' AND "createdAt">=${start} AND "createdAt"<${end} GROUP BY 1 ORDER BY value DESC LIMIT 10`,
      prisma.$queryRaw`SELECT COUNT(DISTINCT "visitorId") FILTER (WHERE type='PAGE_VIEW')::int AS visitors, COUNT(DISTINCT "visitorId") FILTER (WHERE type='PRODUCT_VIEWED')::int AS product_viewers, COUNT(*) FILTER (WHERE type='CHECKOUT_STARTED')::int AS checkouts, COUNT(*) FILTER (WHERE type='PAYMENT_ATTEMPTED')::int AS payment_attempts, COUNT(*) FILTER (WHERE type='PAYMENT_SUCCESS')::int AS purchases FROM "AnalyticsEvent" WHERE "createdAt">=${start} AND "createdAt"<${end}`,
      prisma.order.findMany({ where: { createdAt: { gte: start, lt: end } }, orderBy: { createdAt: 'desc' }, take: 8, select: { id:true,totalAmount:true,status:true,createdAt:true,user:{select:{email:true,firstName:true,lastName:true}},product:{select:{title:true}} } }),
      prisma.$queryRaw`SELECT "userId","productId",COUNT(*)::int AS downloads FROM "DownloadLog" WHERE "createdAt">=${start} AND "createdAt"<${end} GROUP BY "userId","productId" HAVING COUNT(*)>=10 ORDER BY downloads DESC LIMIT 10`,
      prisma.$queryRaw`SELECT p.id,p.title,COUNT(v.id)::int AS views,COALESCE(s.orders,0)::int AS orders,COALESCE(s.revenue,0)::numeric AS revenue,CASE WHEN COUNT(v.id)=0 THEN 0 ELSE ROUND((COALESCE(s.orders,0)::numeric/COUNT(v.id)::numeric)*100,2) END AS conversion FROM "Product" p LEFT JOIN "AnalyticsEvent" v ON v."productId"=p.id AND v.type='PRODUCT_VIEWED' AND v."createdAt">=${start} AND v."createdAt"<${end} LEFT JOIN (SELECT "productId",COUNT(*)::int AS orders,COALESCE(SUM("totalAmount"),0)::numeric AS revenue FROM "Order" WHERE "status"='SUCCESS' AND "createdAt">=${start} AND "createdAt"<${end} GROUP BY "productId") s ON s."productId"=p.id WHERE p."isArchived"=false GROUP BY p.id,p.title,s.orders,s.revenue HAVING COUNT(v.id)>0 ORDER BY conversion DESC,views DESC LIMIT 10`,
      prisma.product.findMany({where:{isArchived:false,isDigital:true,OR:[{assetUrl:null},{assetUrl:''}]},select:{id:true,title:true},take:25}),
    ]);

    const attention=[];
    if (metrics.pendingOrders>0) attention.push({severity:'warning',title:`${metrics.pendingOrders} pending orders`,detail:'Review payment state before they become stale.'});
    if (metrics.failedPayments>0) attention.push({severity:'warning',title:`${metrics.failedPayments} failed payments`,detail:'Check the payment center for failure patterns.'});
    if (metrics.productViews>=30 && metrics.orders===0) attention.push({severity:'critical',title:'Product views are not converting',detail:'Traffic is reaching products but no successful sales were recorded in this period.'});
    if (suspiciousDownloads.length) attention.push({severity:'critical',title:`${suspiciousDownloads.length} suspicious download patterns`,detail:'A customer/product pair crossed the download review threshold.'});
    if (missingDigitalAssets.length) attention.push({severity:'critical',title:`${missingDigitalAssets.length} digital product assets missing`,detail:'One or more active digital products do not have an asset URL.'});

    return res.json({
      range,start,end,timestamp:new Date().toISOString(),metrics,
      revenueSeries:revenueSeries.map(r=>({day:r.day,revenue:money(r.revenue),orders:Number(r.orders)})),
      topProducts:topProducts.map(r=>({id:r.id,title:r.title,orders:Number(r.orders),revenue:money(r.revenue)})),
      devices:devices.map(r=>({device:r.device,value:Number(r.value)})),
      sources:sources.map(r=>({source:r.source,value:Number(r.value)})),
      countries:countries.map(r=>({country:r.country,value:Number(r.value)})),
      funnel:{visitors:Number(funnel?.[0]?.visitors||0),productViewers:Number(funnel?.[0]?.product_viewers||0),checkouts:Number(funnel?.[0]?.checkouts||0),paymentAttempts:Number(funnel?.[0]?.payment_attempts||0),purchases:Number(funnel?.[0]?.purchases||0)},
      recentOrders,
      topConvertingProducts:topConvertingProducts.map(r=>({id:r.id,title:r.title,views:Number(r.views),orders:Number(r.orders),revenue:money(r.revenue),conversion:Number(r.conversion||0)})),
      productHealth:{missingDigitalAssets:missingDigitalAssets.map(p=>({id:p.id,title:p.title}))},
      attention,
    });
  } catch(error) {
    console.error('[ADMIN] Overview error:',{requestId:req.requestId,message:error.message});
    return res.status(500).json({error:'Failed to retrieve the Pluten business overview.'});
  }
}

async function getLive(req,res){
  try{
    const cutoff=new Date(Date.now()-90000);
    const sessions=await prisma.analyticsSession.findMany({where:{lastSeen:{gte:cutoff}},orderBy:{lastSeen:'desc'},take:100,select:{sessionKey:true,visitorId:true,currentPath:true,deviceType:true,browser:true,os:true,country:true,lastSeen:true,firstSeen:true,user:{select:{email:true,firstName:true,lastName:true}}}});
    return res.json({count:sessions.length,sessions,updatedAt:new Date().toISOString()});
  }catch(error){console.error('[ADMIN] Live error:',{requestId:req.requestId,message:error.message});return res.status(500).json({error:'Failed to load live visitors.'});}
}

async function getProductAnalytics(req,res){
  try{
    const {start,end}=getWindow(req.query.range);
    const [views,sales]=await Promise.all([
      prisma.$queryRaw`SELECT p.id,p.title,COUNT(e.id)::int AS views,COUNT(DISTINCT e."visitorId")::int AS unique_viewers FROM "Product" p LEFT JOIN "AnalyticsEvent" e ON e."productId"=p.id AND e.type='PRODUCT_VIEWED' AND e."createdAt">=${start} AND e."createdAt"<${end} WHERE p."isArchived"=false GROUP BY p.id,p.title ORDER BY views DESC LIMIT 50`,
      prisma.$queryRaw`SELECT p.id,p.title,COUNT(o.id)::int AS orders,COALESCE(SUM(o."totalAmount"),0)::numeric AS revenue FROM "Product" p LEFT JOIN "Order" o ON o."productId"=p.id AND o."status"='SUCCESS' AND o."createdAt">=${start} AND o."createdAt"<${end} WHERE p."isArchived"=false GROUP BY p.id,p.title ORDER BY orders DESC,revenue DESC LIMIT 50`,
    ]);
    const salesMap=new Map(sales.map(s=>[s.id,{orders:Number(s.orders),revenue:money(s.revenue)}]));
    return res.json({range,start,end,data:views.map(v=>{const s=salesMap.get(v.id)||{orders:0,revenue:0};return{id:v.id,title:v.title,views:Number(v.views),uniqueViewers:Number(v.unique_viewers),orders:s.orders,revenue:s.revenue,conversion:percent(s.orders,Number(v.views))};})});
  }catch(error){console.error('[ADMIN] Product analytics error:',{requestId:req.requestId,message:error.message});return res.status(500).json({error:'Failed to retrieve product analytics.'});}
}

async function getPortfolioAnalytics(req,res){
  try{
    const {start,end}=getWindow(req.query.range);
    const [total,published,drafts,created,publishedPeriod,usersWithPortfolio,views,templates]=await Promise.all([
      prisma.portfolio.count({where:{deletedAt:null}}),
      prisma.portfolio.count({where:{status:'PUBLISHED',deletedAt:null}}),
      prisma.portfolio.count({where:{status:'DRAFT',deletedAt:null}}),
      prisma.portfolio.count({where:{createdAt:{gte:start,lt:end}}}),
      prisma.portfolio.count({where:{publishedAt:{gte:start,lt:end},status:'PUBLISHED'}}),
      prisma.$queryRaw`SELECT COUNT(DISTINCT "userId")::int AS value FROM "Portfolio" WHERE "deletedAt" IS NULL`,
      prisma.$queryRaw`SELECT COUNT(*)::int AS views,COUNT(DISTINCT "visitorId")::int AS unique_viewers FROM "AnalyticsEvent" WHERE type='PORTFOLIO_VIEWED' AND "createdAt">=${start} AND "createdAt"<${end}`,
      prisma.$queryRaw`SELECT "template",COUNT(*)::int AS value FROM "Portfolio" WHERE "deletedAt" IS NULL GROUP BY "template" ORDER BY value DESC LIMIT 10`,
    ]);
    const totalCustomers=await prisma.user.count({where:{role:'CUSTOMER'}});
    return res.json({range,start,end,totals:{total,published,drafts,created,publishedPeriod,usersWithPortfolio:Number(usersWithPortfolio?.[0]?.value||0),usersWithoutPortfolio:Math.max(0,totalCustomers-Number(usersWithPortfolio?.[0]?.value||0)),views:Number(views?.[0]?.views||0),uniqueViewers:Number(views?.[0]?.unique_viewers||0),activationRate:percent(Number(usersWithPortfolio?.[0]?.value||0),totalCustomers)},templates:templates.map(t=>({template:t.template,value:Number(t.value)}))});
  }catch(error){console.error('[ADMIN] Portfolio analytics error:',{requestId:req.requestId,message:error.message});return res.status(500).json({error:'Failed to retrieve portfolio analytics.'});}
}

async function getOrders(req,res){
  try{const {page,limit,skip}=parsePagination(req);const search=String(req.query.search||'').trim();const where=search?{OR:[{transactionId:{contains:search,mode:'insensitive'}},{id:{contains:search,mode:'insensitive'}},{gatewayOrderId:{contains:search,mode:'insensitive'}},{user:{email:{contains:search,mode:'insensitive'}}},{product:{title:{contains:search,mode:'insensitive'}}}]}:undefined;const [orders,total]=await Promise.all([prisma.order.findMany({where,skip,take:limit,orderBy:{createdAt:'desc'},include:{user:{select:{email:true,firstName:true,lastName:true}},product:{select:{title:true}}}}),prisma.order.count({where})]);return res.json({data:orders,pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))}});}catch(error){console.error('[ADMIN] Orders error:',{requestId:req.requestId,message:error.message});return res.status(500).json({error:'Failed to retrieve order ledger.'});}
}

async function getCustomers(req,res){
  try{const {page,limit,skip}=parsePagination(req);const search=String(req.query.search||'').trim();const where={role:'CUSTOMER',...(search?{OR:[{email:{contains:search,mode:'insensitive'}},{firstName:{contains:search,mode:'insensitive'}},{lastName:{contains:search,mode:'insensitive'}}]}:{})};const [customers,total]=await Promise.all([prisma.user.findMany({where,skip,take:limit,orderBy:{createdAt:'desc'},select:{id:true,email:true,firstName:true,lastName:true,isPremium:true,createdAt:true,_count:{select:{orders:{where:{status:'SUCCESS'}},portfolios:true}}}}),prisma.user.count({where})]);return res.json({data:customers,pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))}});}catch(error){console.error('[ADMIN] Customers error:',{requestId:req.requestId,message:error.message});return res.status(500).json({error:'Failed to retrieve customer directory.'});}
}

async function getCustomer(req,res){
  try{const customer=await prisma.user.findFirst({where:{id:req.params.id,role:'CUSTOMER'},select:{id:true,email:true,firstName:true,lastName:true,isPremium:true,createdAt:true,orders:{orderBy:{createdAt:'desc'},include:{product:{select:{title:true}}}},portfolios:{orderBy:{updatedAt:'desc'},select:{id:true,username:true,slug:true,status:true,template:true,createdAt:true,updatedAt:true}},downloadLogs:{orderBy:{createdAt:'desc'},take:50,include:{product:{select:{title:true}}}}}});if(!customer)return res.status(404).json({error:'Customer not found.'});const totalSpend=customer.orders.filter(o=>o.status==='SUCCESS').reduce((sum,o)=>sum+money(o.totalAmount),0);return res.json({...customer,totalSpend:Number(totalSpend.toFixed(2)),successfulOrders:customer.orders.filter(o=>o.status==='SUCCESS').length});}catch(error){console.error('[ADMIN] Customer detail error:',{requestId:req.requestId,message:error.message});return res.status(500).json({error:'Failed to retrieve customer profile.'});}
}

async function getAuditLogs(req,res){
  try{const {page,limit,skip}=parsePagination(req);const search=String(req.query.search||'').trim();const where=search?{OR:[{action:{contains:search,mode:'insensitive'}},{entity:{contains:search,mode:'insensitive'}},{entityId:{contains:search,mode:'insensitive'}},{user:{email:{contains:search,mode:'insensitive'}}}]}:undefined;const [rows,total]=await Promise.all([prisma.auditLog.findMany({where,skip,take:limit,orderBy:{createdAt:'desc'},include:{user:{select:{email:true,firstName:true,lastName:true,role:true}}}}),prisma.auditLog.count({where})]);return res.json({data:rows,pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))}});}catch(error){console.error('[ADMIN] Audit logs error:',error.message);return res.status(500).json({error:'Failed to retrieve audit logs.'});}
}

async function getDownloads(req,res){
  try{const {page,limit,skip}=parsePagination(req);const [rows,total]=await Promise.all([prisma.downloadLog.findMany({skip,take:limit,orderBy:{createdAt:'desc'},include:{user:{select:{email:true,firstName:true,lastName:true}},product:{select:{title:true}}}}),prisma.downloadLog.count()]);return res.json({data:rows,pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))}});}catch(error){console.error('[ADMIN] Download logs error:',error.message);return res.status(500).json({error:'Failed to retrieve download logs.'});}
}

async function getHealth(req,res){
  const started=Date.now();
  try{await prisma.$queryRaw`SELECT 1`;return res.json({status:'ok',database:{status:'ok',latencyMs:Date.now()-started},server:{uptimeSeconds:Math.round(process.uptime()),node:process.version},timestamp:new Date().toISOString()});}catch(error){return res.status(503).json({status:'degraded',database:{status:'error',message:'Database health check failed.'},server:{uptimeSeconds:Math.round(process.uptime()),node:process.version},timestamp:new Date().toISOString()});}
}

module.exports={getOverview,getLive,getProductAnalytics,getPortfolioAnalytics,getOrders,getCustomers,getCustomer,getAuditLogs,getDownloads,getHealth};
