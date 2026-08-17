import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

type Product = { id:string; title:string; description:string; price:number; thumbnail:string|null; category:string; originalPrice?:number; finalPrice?:number; discountAmount?:number; discountLabel?:string|null };

async function getProduct(id:string):Promise<Product|null>{
  const baseUrl=process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  if(!baseUrl)return null;
  try{const response=await fetch(`${baseUrl}/products/${encodeURIComponent(id)}`,{next:{revalidate:60,tags:[`product:${id}`]}});if(!response.ok)return null;return await response.json();}catch{return null;}
}

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
  const {id}=await params; const product=await getProduct(id);
  if(!product)return {title:'Product unavailable'};
  return {title:product.title,description:product.description,alternates:{canonical:`https://pluten.site/product/${id}`},openGraph:{title:`${product.title} | Pluten`,description:product.description,url:`https://pluten.site/product/${id}`,type:'website',images:product.thumbnail?[{url:product.thumbnail,alt:product.title}]:undefined}};
}

export default async function ProductPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params; const product=await getProduct(id);
  if(!product){return <main className="pluten-error-page"><section className="pluten-error-card"><div className="pluten-error-kicker">PLUTEN / PRODUCT</div><h1>Product unavailable.</h1><p>This product no longer exists or is temporarily unavailable.</p></section></main>;}
  const jsonLd={
    '@context':'https://schema.org','@type':'Product',name:product.title,description:product.description,image:product.thumbnail?[product.thumbnail]:[],sku:product.id,brand:{'@type':'Brand',name:'Pluten'},offers:{'@type':'Offer',url:`https://pluten.site/product/${id}`,priceCurrency:'INR',price:Number(product.finalPrice ?? product.price).toFixed(2),availability:'https://schema.org/InStock'},
  };
  const safeJson=JSON.stringify(jsonLd).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJson}}/><ProductDetailClient id={id} initialProduct={product}/></>;
}
