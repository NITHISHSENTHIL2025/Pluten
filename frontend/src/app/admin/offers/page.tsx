"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, ChevronRight, Edit2, Loader2, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import styles from './offers.module.css';

type Status = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';
type ApplyTo = 'ALL' | 'SELECTED';
type DiscountType = 'PERCENTAGE' | 'FIXED';

type Product = { id: string; title: string; price: number; thumbnail?: string | null; category?: string };
type OfferProduct = { id: string; title: string };
type Offer = {
  id: string; name: string; type: DiscountType; value: number; applyTo: ApplyTo;
  minOrderAmount: number | null; couponCode: string | null; autoApply: boolean; status: Status;
  startAt: string; endAt: string; products?: OfferProduct[];
};
type Pagination = { page: number; limit: number; total: number; totalPages: number };
type FormState = {
  name: string; type: DiscountType; value: string; applyTo: ApplyTo; productIds: string[];
  minOrderAmount: string; couponCode: string; autoApply: boolean; status: Status; startAt: string; endAt: string;
};

const PAGE_SIZE = 25;
const blankForm = (): FormState => ({
  name: '', type: 'PERCENTAGE', value: '', applyTo: 'ALL', productIds: [], minOrderAmount: '', couponCode: '',
  autoApply: true, status: 'ACTIVE', startAt: '', endAt: '',
});

const toInputDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIso = (value: string) => new Date(value).toISOString();

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [form, setForm] = useState<FormState>(blankForm());
  const [selectedProductMap, setSelectedProductMap] = useState<Record<string, OfferProduct>>({});

  const loadOffers = async (nextPage = 1, nextSearch = search) => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await apiClient.get('/offers/admin', {
        params: { page: nextPage, limit: PAGE_SIZE, search: nextSearch.trim() },
      });
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setOffers(data);
      setPagination(response.data?.pagination || { page: nextPage, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setPage(nextPage);
    } catch (error: any) {
      setLoadError(error?.response?.data?.error || 'Unable to load promotions.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (query = '') => {
    try {
      const response = await apiClient.get('/admin/products', { params: { page: 1, limit: 50, search: query.trim() } });
      setProducts(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadOffers(1, search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(productSearch), 200);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const selectedProducts = useMemo(
    () => Object.values(selectedProductMap).filter((product) => form.productIds.includes(product.id)),
    [selectedProductMap, form.productIds],
  );

  const reset = () => {
    setModalOpen(false); setEditingId(null); setSaving(false); setFormError(''); setProductSearch(''); setForm(blankForm()); setSelectedProductMap({});
  };

  const openCreate = () => {
    reset(); setModalOpen(true); loadProducts('');
  };

  const openEdit = (offer: Offer) => {
    const selected = Array.isArray(offer.products) ? offer.products : [];
    setEditingId(offer.id);
    setForm({
      name: offer.name || '', type: offer.type, value: String(offer.value), applyTo: offer.applyTo,
      productIds: selected.map((product) => product.id), minOrderAmount: offer.minOrderAmount == null ? '' : String(offer.minOrderAmount),
      couponCode: offer.couponCode || '', autoApply: Boolean(offer.autoApply), status: offer.status,
      startAt: toInputDate(offer.startAt), endAt: toInputDate(offer.endAt),
    });
    setSelectedProductMap(Object.fromEntries(selected.map((product) => [product.id, product])));
    setFormError(''); setProductSearch(''); setModalOpen(true); loadProducts('');
  };

  const toggleProduct = (product: Product) => {
    const checked = form.productIds.includes(product.id);
    setSelectedProductMap((current) => ({ ...current, [product.id]: { id: product.id, title: product.title } }));
    setForm((current) => ({ ...current, productIds: checked ? current.productIds.filter((id) => id !== product.id) : [...current.productIds, product.id] }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    const value = Number(form.value);
    const minimum = form.minOrderAmount === '' ? null : Number(form.minOrderAmount);
    if (!form.name.trim()) return setFormError('Offer name is required.');
    if (!Number.isFinite(value) || value <= 0) return setFormError('Enter a valid discount value.');
    if (form.type === 'PERCENTAGE' && value > 100) return setFormError('Percentage discount cannot exceed 100%.');
    if (minimum !== null && (!Number.isFinite(minimum) || minimum < 0)) return setFormError('Enter a valid minimum order amount.');
    if (form.applyTo === 'SELECTED' && !form.productIds.length) return setFormError('Select at least one product.');
    if (!form.startAt || !form.endAt) return setFormError('Start and end dates are required.');
    const start = new Date(form.startAt); const end = new Date(form.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return setFormError('End date must be after the start date.');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), type: form.type, value, applyTo: form.applyTo,
        productIds: form.applyTo === 'SELECTED' ? form.productIds : [], minOrderAmount: minimum,
        couponCode: form.couponCode.trim() || null, autoApply: form.autoApply, status: form.status,
        startAt: toIso(form.startAt), endAt: toIso(form.endAt),
      };
      if (editingId) await apiClient.put(`/offers/admin/${editingId}`, payload);
      else await apiClient.post('/offers/admin', payload);
      await loadOffers(editingId ? page : 1, search);
      reset();
    } catch (error: any) {
      setFormError(error?.response?.data?.error || 'Failed to save offer.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/offers/admin/${id}`);
      const nextPage = offers.length === 1 && page > 1 ? page - 1 : page;
      await loadOffers(nextPage, search);
    } catch (error: any) {
      setLoadError(error?.response?.data?.error || 'Failed to delete offer.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>PLUTEN / PROMOTIONS</p><h1>Offers</h1><p className={styles.subtitle}>Create precise, product-level discounts without touching checkout code.</p></div>
          <button className={styles.primaryButton} onClick={openCreate}><Plus size={18} />Create offer</button>
        </header>

        <div className={styles.searchBox} style={{ marginBottom: 18 }}>
          <Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search offers, coupons or products..." aria-label="Search offers" />
        </div>

        {loading ? <div className={styles.loading}><Loader2 className={styles.spin} size={30} /><span>Loading promotions</span></div> : loadError ? <div className={styles.errorState}><AlertCircle size={22} /><h2>Promotions unavailable.</h2><p>{loadError}</p><button className={styles.secondaryButton} onClick={() => loadOffers(page, search)}>Retry</button></div> : <>
          <div className={styles.summary}><span><strong>{pagination.total}</strong> total offers</span><span><strong>{offers.filter((offer) => offer.status === 'ACTIVE').length}</strong> active on this page</span></div>
          {offers.length === 0 ? <div className={styles.empty}><Tag size={22} /><h2>No offers found.</h2><p>Create your first promotion or change the search.</p><button className={styles.primaryButton} onClick={openCreate}><Plus size={17} />Create offer</button></div> : <div className={styles.tableCard}><div className={styles.tableScroll}><table><thead><tr><th>Offer</th><th>Discount</th><th>Applies to</th><th>Status</th><th>Valid until</th><th>Actions</th></tr></thead><tbody>{offers.map((offer) => <tr key={offer.id}><td><strong>{offer.name}</strong>{offer.autoApply && <span className={styles.autoPill}>Auto</span>}</td><td>{offer.type === 'PERCENTAGE' ? `${offer.value}% OFF` : `₹${Number(offer.value).toLocaleString('en-IN')} OFF`}</td><td>{offer.applyTo === 'ALL' ? 'All products' : `${Array.isArray(offer.products) ? offer.products.length : 0} selected`}</td><td><span className={`${styles.status} ${styles[offer.status.toLowerCase()]}`}>{offer.status}</span></td><td>{new Date(offer.endAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td><div className={styles.rowActions}><button className={styles.iconButton} onClick={() => openEdit(offer)} aria-label={`Edit ${offer.name}`}><Edit2 size={16} /></button><button className={`${styles.iconButton} ${styles.danger}`} onClick={() => remove(offer.id)} disabled={deletingId === offer.id} aria-label={`Delete ${offer.name}`}>{deletingId === offer.id ? <Loader2 className={styles.spin} size={16} /> : <Trash2 size={16} />}</button></div></td></tr>)}</tbody></table></div></div>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 12, color: '#777', fontSize: 11 }}>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}><button className={styles.iconButton} disabled={pagination.page <= 1 || loading} onClick={() => loadOffers(pagination.page - 1, search)} aria-label="Previous offers page"><ChevronLeft size={16} /></button><button className={styles.iconButton} disabled={pagination.page >= pagination.totalPages || loading} onClick={() => loadOffers(pagination.page + 1, search)} aria-label="Next offers page"><ChevronRight size={16} /></button></div>
          </div>
        </>}
      </div>

      {modalOpen && <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="offer-editor-title"><div className={styles.modal}><div className={styles.modalHeader}><div><p className={styles.eyebrow}>PLUTEN / OFFER ENGINE</p><h2 id="offer-editor-title">{editingId ? 'Edit offer' : 'Create offer'}</h2></div><button className={styles.closeButton} onClick={reset} aria-label="Close offer editor"><X size={19} /></button></div>
        {formError && <div className={styles.formError}><AlertCircle size={16} />{formError}</div>}
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}><label>Offer name</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Launch week" autoFocus /></div>
          <div className={styles.twoCol}><div className={styles.field}><label>Discount type</label><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as DiscountType })}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></div><div className={styles.field}><label>{form.type === 'PERCENTAGE' ? 'Discount %' : 'Discount amount'}</label><input inputMode="decimal" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} placeholder="20" /></div></div>
          <div className={styles.field}><label>Applies to</label><div className={styles.segmented}><button type="button" className={form.applyTo === 'ALL' ? styles.segmentActive : styles.segment} onClick={() => setForm({ ...form, applyTo: 'ALL', productIds: [] })}>All products</button><button type="button" className={form.applyTo === 'SELECTED' ? styles.segmentActive : styles.segment} onClick={() => setForm({ ...form, applyTo: 'SELECTED' })}>Selected products</button></div></div>
          {form.applyTo === 'SELECTED' && <div className={styles.productPicker}><div className={styles.searchBox}><Search size={16} /><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products..." aria-label="Search products" /></div><div className={styles.selectionHeader}><span><strong>{form.productIds.length}</strong> selected</span><button type="button" onClick={() => { setForm({ ...form, productIds: [] }); setSelectedProductMap({}); }} disabled={!form.productIds.length}>Clear</button></div><div className={styles.productList}>{products.length === 0 ? <p className={styles.noResults}>No products found.</p> : products.map((product) => { const checked = form.productIds.includes(product.id); return <button type="button" key={product.id} className={checked ? styles.productOptionActive : styles.productOption} onClick={() => toggleProduct(product)}><span className={styles.checkbox}>{checked ? <Check size={14} /> : null}</span><span className={styles.productOptionText}><strong>{product.title}</strong><small>₹{Number(product.price).toLocaleString('en-IN')}</small></span></button>; })}</div>{selectedProducts.length > 0 && <div className={styles.selectedSummary}>{selectedProducts.map((product) => <span key={product.id}>{product.title}<button type="button" onClick={() => setForm({ ...form, productIds: form.productIds.filter((id) => id !== product.id) })} aria-label={`Remove ${product.title}`}><X size={12} /></button></span>)}</div>}</div>}
          <div className={styles.twoCol}><div className={styles.field}><label>Minimum order</label><input inputMode="decimal" value={form.minOrderAmount} onChange={(event) => setForm({ ...form, minOrderAmount: event.target.value })} placeholder="Optional" /></div><div className={styles.field}><label>Coupon code</label><input value={form.couponCode} onChange={(event) => setForm({ ...form, couponCode: event.target.value })} placeholder="Optional" /></div></div>
          <div className={styles.twoCol}><div className={styles.field}><label>Start</label><input type="datetime-local" value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} /></div><div className={styles.field}><label>End</label><input type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} /></div></div>
          <div className={styles.switchRow}><div><strong>Auto apply</strong><span>Use automatically when this offer is eligible.</span></div><button type="button" aria-pressed={form.autoApply} className={form.autoApply ? styles.switchOn : styles.switchOff} onClick={() => setForm({ ...form, autoApply: !form.autoApply })}><span /></button></div>
          <div className={styles.field}><label>Status</label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })}><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="EXPIRED">Expired</option></select></div>
          <div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={reset}>Cancel</button><button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? <><Loader2 className={styles.spin} size={17} />Saving</> : editingId ? 'Save changes' : 'Create offer'}</button></div>
        </form>
      </div></div>}
    </main>
  );
}
