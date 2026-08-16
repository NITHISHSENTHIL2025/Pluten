// frontend/src/app/admin/offers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import apiClient from "@/lib/apiClient";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Edit2,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import styles from "../admin.module.css";

type OfferType = "PERCENTAGE" | "FIXED";
type OfferStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED";
type AppliesTo = "ALL" | "SELECTED";

interface Product {
  id: string;
  title: string;
  price: number | string;
  thumbnail?: string | null;
  category?: string;
}

interface Offer {
  id: string;
  name: string;
  type: OfferType;
  value: number;
  applyTo: AppliesTo;
  minOrderAmount: number | null;
  couponCode: string | null;
  autoApply: boolean;
  status: OfferStatus;
  startAt: string;
  endAt: string;
  products?: Product[];
}

interface AdminProductsResponse {
  data: Product[];
}

function toLocalInputValue(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

const emptyForm = {
  name: "",
  type: "PERCENTAGE" as OfferType,
  value: "",
  applyTo: "ALL" as AppliesTo,
  selectedProductIds: [] as string[],
  minOrderAmount: "",
  couponCode: "",
  autoApply: true,
  status: "DRAFT" as OfferStatus,
  startAt: "",
  endAt: "",
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [productQuery, setProductQuery] = useState("");

  const selectedProducts = useMemo(
    () =>
      products.filter((product) =>
        form.selectedProductIds.includes(product.id)
      ),
    [form.selectedProductIds, products]
  );

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      `${product.title} ${product.category ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [productQuery, products]);

  const fetchAll = async () => {
    setFetchError(null);

    try {
      const [offersResponse, productsResponse] = await Promise.all([
        apiClient.get<Offer[]>("/offers/admin"),
        apiClient.get<AdminProductsResponse>("/admin/products?limit=100"),
      ]);

      setOffers(
        Array.isArray(offersResponse.data)
          ? offersResponse.data
          : []
      );

      setProducts(
        Array.isArray(productsResponse.data?.data)
          ? productsResponse.data.data
          : []
      );
    } catch (error: any) {
      console.error("Failed to load offer manager:", error);
      setFetchError(
        error.response?.data?.error ||
          "Unable to load offers right now."
      );
    } finally {
      setLoading(false);
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setProductQuery("");
    setErrorMsg(null);
    setEditingId(null);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setForm({
      ...emptyForm,
      status: "DRAFT",
      autoApply: false,
    });
    setIsModalOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setErrorMsg(null);
    setProductQuery("");

    setForm({
      name: offer.name,
      type: offer.type,
      value: String(offer.value),
      applyTo: offer.applyTo,
      selectedProductIds:
        offer.products?.map((product) => product.id) ?? [],
      minOrderAmount:
        offer.minOrderAmount === null
          ? ""
          : String(offer.minOrderAmount),
      couponCode: offer.couponCode ?? "",
      autoApply: offer.autoApply,
      status: offer.status,
      startAt: toLocalInputValue(offer.startAt),
      endAt: toLocalInputValue(offer.endAt),
    });

    setIsModalOpen(true);
  };

  const toggleProduct = (productId: string) => {
    setForm((current) => ({
      ...current,
      selectedProductIds: current.selectedProductIds.includes(productId)
        ? current.selectedProductIds.filter((id) => id !== productId)
        : [...current.selectedProductIds, productId],
    }));
  };

  const toggleAllFilteredProducts = () => {
    const filteredIds = filteredProducts.map((product) => product.id);
    const allSelected = filteredIds.every((id) =>
      form.selectedProductIds.includes(id)
    );

    setForm((current) => ({
      ...current,
      selectedProductIds: allSelected
        ? current.selectedProductIds.filter(
            (id) => !filteredIds.includes(id)
          )
        : Array.from(
            new Set([...current.selectedProductIds, ...filteredIds])
          ),
    }));
  };

  const parseApiError = (error: any) => {
    const data = error?.response?.data;

    if (Array.isArray(data?.details)) {
      return data.details
        .map((item: any) => item.message || item.field)
        .join(" • ");
    }

    return (
      data?.error ||
      data?.message ||
      "The offer could not be saved. Please check the fields and try again."
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim()) {
      setErrorMsg("Offer name is required.");
      return;
    }

    const numericValue = Number(form.value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setErrorMsg("Discount value must be greater than zero.");
      return;
    }

    if (form.type === "PERCENTAGE" && numericValue > 100) {
      setErrorMsg("Percentage discount cannot exceed 100%.");
      return;
    }

    if (!form.startAt || !form.endAt) {
      setErrorMsg("Start and end times are required.");
      return;
    }

    if (new Date(form.endAt) <= new Date(form.startAt)) {
      setErrorMsg("End time must be after start time.");
      return;
    }

    if (
      form.applyTo === "SELECTED" &&
      form.selectedProductIds.length === 0
    ) {
      setErrorMsg("Select at least one product.");
      return;
    }

    const minOrder =
      form.minOrderAmount.trim() === ""
        ? null
        : Number(form.minOrderAmount);

    if (
      minOrder !== null &&
      (!Number.isFinite(minOrder) || minOrder < 0)
    ) {
      setErrorMsg("Minimum order amount must be a valid non-negative number.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      value: numericValue,
      applyTo: form.applyTo,
      minOrderAmount: minOrder,
      couponCode: form.couponCode.trim() || null,
      autoApply: form.autoApply,
      status: form.status,
      startAt: toIso(form.startAt),
      endAt: toIso(form.endAt),
      productIds:
        form.applyTo === "SELECTED"
          ? form.selectedProductIds
          : [],
    };

    try {
      if (editingId) {
        await apiClient.put(`/offers/admin/${editingId}`, payload);
      } else {
        await apiClient.post("/offers/admin", payload);
      }

      setIsModalOpen(false);
      resetForm();
      await fetchAll();
    } catch (error) {
      console.error("Offer save failed:", error);
      setErrorMsg(parseApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this offer? This cannot be undone.")) return;

    setDeletingId(id);

    try {
      await apiClient.delete(`/offers/admin/${id}`);
      await fetchAll();
    } catch (error: any) {
      setFetchError(
        error.response?.data?.error ||
          "The offer could not be deleted."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500">
          <Loader2 className="animate-spin" size={22} />
          <span className="text-xs uppercase tracking-[0.2em]">
            Loading offers
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
            PLUTEN / PROMOTIONS
          </div>
          <h1 className={styles.pageTitle}>Offers</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Control discounts without touching checkout code.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className={styles.primaryButton}
        >
          <Plus size={18} />
          Create offer
        </button>
      </div>

      {fetchError && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-950 bg-red-950/20 p-4 text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="text-sm">{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={fetchAll}
            className="shrink-0 rounded-lg border border-red-900 px-3 py-2 text-xs font-bold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
        <span>{offers.length} total offers</span>
        <span>•</span>
        <span>
          {offers.filter((offer) => offer.status === "ACTIVE").length} active
        </span>
      </div>

      <div className={styles.tableCard}>
        <div className="overflow-x-auto">
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Offer</th>
                <th className={styles.th}>Discount</th>
                <th className={styles.th}>Applies to</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Valid until</th>
                <th className={`${styles.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <Tag size={28} className="mb-4 text-neutral-700" />
                      <strong className="text-sm uppercase tracking-wider text-neutral-400">
                        No offers yet
                      </strong>
                      <span className="mt-2 text-sm text-neutral-600">
                        Create your first promotion to start testing the offer system.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer.id}>
                    <td className={styles.td}>
                      <div className="min-w-[180px]">
                        <div className="font-bold text-white">{offer.name}</div>
                        {offer.couponCode && (
                          <div className="mt-1 text-[10px] uppercase tracking-wider text-neutral-600">
                            Code: {offer.couponCode}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className={styles.td}>
                      <span className="inline-flex rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs font-bold text-white">
                        {offer.type === "PERCENTAGE"
                          ? `${offer.value}%`
                          : `₹${Number(offer.value).toLocaleString("en-IN")}`}
                      </span>
                    </td>

                    <td className={styles.td}>
                      {offer.applyTo === "ALL" ? (
                        <span className="text-xs text-neutral-400">All products</span>
                      ) : (
                        <div>
                          <div className="text-xs font-semibold text-neutral-300">
                            {offer.products?.length ?? 0} selected product
                            {(offer.products?.length ?? 0) === 1 ? "" : "s"}
                          </div>
                          <div className="mt-1 max-w-[220px] truncate text-[10px] text-neutral-600">
                            {offer.products?.map((p) => p.title).join(", ") || "—"}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className={styles.td}>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          offer.status === "ACTIVE"
                            ? "border-emerald-900 bg-emerald-950/50 text-emerald-400"
                            : offer.status === "PAUSED"
                              ? "border-amber-900 bg-amber-950/40 text-amber-400"
                              : "border-neutral-800 bg-neutral-950 text-neutral-500"
                        }`}
                      >
                        {offer.status}
                      </span>
                    </td>

                    <td className={styles.td}>
                      <span className="whitespace-nowrap text-xs text-neutral-500">
                        {new Date(offer.endAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </td>

                    <td className={`${styles.td} text-right`}>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(offer)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 transition hover:border-neutral-700 hover:text-white"
                          aria-label={`Edit ${offer.name}`}
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(offer.id)}
                          disabled={deletingId === offer.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-950 bg-red-950/20 text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Delete ${offer.name}`}
                        >
                          {deletingId === offer.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-dialog-title"
        >
          <div className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-neutral-800 bg-[#0c0c0c] shadow-[0_30px_100px_rgba(0,0,0,.7)] sm:max-h-[92dvh] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-900 px-5 py-4 sm:px-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                  PLUTEN / OFFER ENGINE
                </div>
                <h2
                  id="offer-dialog-title"
                  className="mt-1 text-lg font-black tracking-tight text-white"
                >
                  {editingId ? "Edit offer" : "Create offer"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 text-neutral-500 hover:text-white disabled:opacity-50"
                aria-label="Close offer editor"
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
            >
              {errorMsg && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-950 bg-red-950/20 p-4 text-sm text-red-300">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                    Offer name
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Summer launch"
                    maxLength={80}
                    required
                    className="h-12 w-full rounded-xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none transition placeholder:text-neutral-700 focus:border-neutral-600"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                    Discount type
                  </span>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          type: event.target.value as OfferType,
                        }))
                      }
                      className="h-12 w-full appearance-none rounded-xl border border-neutral-800 bg-black px-4 pr-10 text-sm text-white outline-none focus:border-neutral-600"
                    >
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed amount</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600"
                      size={16}
                    />
                  </div>
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                    Value
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-600">
                      {form.type === "PERCENTAGE" ? "%" : "₹"}
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      max={form.type === "PERCENTAGE" ? "100" : undefined}
                      step="0.01"
                      value={form.value}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          value: event.target.value,
                        }))
                      }
                      required
                      className="h-12 w-full rounded-xl border border-neutral-800 bg-black pl-10 pr-4 text-sm text-white outline-none focus:border-neutral-600"
                    />
                  </div>
                </label>

                <div className="md:col-span-2 rounded-2xl border border-neutral-900 bg-[#080808] p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                        Applies to
                      </span>
                      <p className="mt-1 text-sm text-neutral-400">
                        Target every product or choose one or many products.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 rounded-xl border border-neutral-800 bg-black p-1">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            applyTo: "ALL",
                            selectedProductIds: [],
                          }))
                        }
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                          form.applyTo === "ALL"
                            ? "bg-white text-black"
                            : "text-neutral-500 hover:text-white"
                        }`}
                      >
                        All products
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            applyTo: "SELECTED",
                          }))
                        }
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                          form.applyTo === "SELECTED"
                            ? "bg-white text-black"
                            : "text-neutral-500 hover:text-white"
                        }`}
                      >
                        Selected
                      </button>
                    </div>
                  </div>

                  {form.applyTo === "SELECTED" && (
                    <div>
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                          <Search
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600"
                          />
                          <input
                            value={productQuery}
                            onChange={(event) =>
                              setProductQuery(event.target.value)
                            }
                            placeholder="Search products..."
                            className="h-11 w-full rounded-xl border border-neutral-800 bg-black pl-10 pr-3 text-sm text-white outline-none focus:border-neutral-600"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={toggleAllFilteredProducts}
                          disabled={filteredProducts.length === 0}
                          className="rounded-xl border border-neutral-800 px-4 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-40"
                        >
                          Toggle visible
                        </button>
                      </div>

                      <div className="mb-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">
                          {form.selectedProductIds.length} selected
                        </span>
                        <span className="text-neutral-600">
                          {filteredProducts.length} matching
                        </span>
                      </div>

                      <div className="max-h-72 overflow-y-auto rounded-xl border border-neutral-900 bg-black/50">
                        {loadingProducts ? (
                          <div className="flex items-center justify-center gap-2 py-12 text-xs text-neutral-600">
                            <Loader2 size={18} className="animate-spin" />
                            Loading products
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="py-12 text-center text-sm text-neutral-600">
                            No matching products.
                          </div>
                        ) : (
                          filteredProducts.map((product) => {
                            const selected = form.selectedProductIds.includes(
                              product.id
                            );

                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => toggleProduct(product.id)}
                                className="flex w-full items-center gap-3 border-b border-neutral-900 px-3 py-3 text-left last:border-b-0 hover:bg-white/[0.03]"
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                    selected
                                      ? "border-white bg-white text-black"
                                      : "border-neutral-700 text-transparent"
                                  }`}
                                >
                                  <Check size={13} strokeWidth={3} />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-white">
                                    {product.title}
                                  </span>
                                  <span className="mt-1 block text-[10px] uppercase tracking-wider text-neutral-600">
                                    {product.category || "Digital product"}
                                  </span>
                                </span>

                                <span className="text-xs text-neutral-500">
                                  ₹{Number(product.price).toLocaleString("en-IN")}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {selectedProducts.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedProducts.map((product) => (
                            <span
                              key={product.id}
                              className="inline-flex max-w-full items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-300"
                            >
                              <span className="max-w-[180px] truncate">
                                {product.title}
                              </span>
                              <button
                                type="button"
                                className="text-neutral-600 hover:text-white"
                                onClick={() => toggleProduct(product.id)}
                                aria-label={`Remove ${product.title}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <label>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                    Minimum order
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderAmount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minOrderAmount: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                    className="h-12 w-full rounded-xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none focus:border-neutral-600"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                    Coupon code
                  </span>
                  <input
                    value={form.couponCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        couponCode: event.target.value.toUpperCase(),
                      }))
                    }
                    maxLength={32}
                    placeholder="Optional"
                    className="h-12 w-full rounded-xl border border-neutral-800 bg-black px-4 text-sm uppercase text-white outline-none focus:border-neutral-600"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                    Start
                  </span>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        startAt: event.target.value,
                      }))
                    }
                    required
                    className="h-12 w-full rounded-xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none focus:border-neutral-600"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                    End
                  </span>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        endAt: event.target.value,
                      }))
                    }
                    required
                    className="h-12 w-full rounded-xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none focus:border-neutral-600"
                  />
                </label>

                <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center justify-between rounded-xl border border-neutral-900 bg-black p-4">
                    <span>
                      <span className="block text-sm font-semibold text-white">
                        Auto apply
                      </span>
                      <span className="mt-1 block text-xs text-neutral-600">
                        Use automatically when the offer is eligible.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.autoApply}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          autoApply: event.target.checked,
                        }))
                      }
                      className="h-5 w-5 accent-white"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                      Status
                    </span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value as OfferStatus,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-neutral-800 bg-black px-4 text-sm text-white outline-none focus:border-neutral-600"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-5 mt-6 flex flex-col-reverse gap-3 border-t border-neutral-900 bg-[#0c0c0c]/95 px-5 py-4 backdrop-blur-xl sm:mx-0 sm:flex-row sm:justify-end sm:px-0">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border border-neutral-800 px-5 text-sm font-semibold text-neutral-400 hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Tag size={17} />
                      {editingId ? "Save changes" : "Create offer"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
