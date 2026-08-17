"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import styles from "./offers.module.css";

type Status =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "EXPIRED";

type ApplyTo = "ALL" | "SELECTED";

type DiscountType =
  | "PERCENTAGE"
  | "FIXED";

type Product = {
  id: string;
  title: string;
  price: number;
  thumbnail?: string | null;
  category?: string;
};

type OfferProduct = {
  id: string;
  title: string;
};

type Offer = {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  applyTo: ApplyTo;
  minOrderAmount: number | null;
  couponCode: string | null;
  autoApply: boolean;
  status: Status;
  startAt: string;
  endAt: string;
  products?: OfferProduct[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type FormState = {
  name: string;
  type: DiscountType;
  value: string;
  applyTo: ApplyTo;
  productIds: string[];
  minOrderAmount: string;
  couponCode: string;
  autoApply: boolean;
  status: Status;
  startAt: string;
  endAt: string;
};

type ProductMap = Record<
  string,
  OfferProduct
>;

const PAGE_SIZE = 25;

const blankForm = (): FormState => ({
  name: "",
  type: "PERCENTAGE",
  value: "",
  applyTo: "ALL",
  productIds: [],
  minOrderAmount: "",
  couponCode: "",
  autoApply: true,
  status: "ACTIVE",
  startAt: "",
  endAt: "",
});

const toInputDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
};

const toIso = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.");
  }

  return date.toISOString();
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(
    []
  );

  const [products, setProducts] = useState<
    Product[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [formError, setFormError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [productSearch, setProductSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });

  const [form, setForm] =
    useState<FormState>(
      blankForm()
    );

  const [selectedProductMap, setSelectedProductMap] =
    useState<ProductMap>({});

  const modalRef =
    useRef<HTMLDivElement | null>(null);

  const closeButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const offersRequestRef =
    useRef(0);

  const productsRequestRef =
    useRef(0);

  const loadOffers = async (
    nextPage = 1,
    nextSearch = search
  ) => {
    const requestId =
      ++offersRequestRef.current;

    setLoading(true);
    setLoadError(null);

    try {
      const response =
        await apiClient.get(
          "/offers/admin",
          {
            params: {
              page: nextPage,
              limit: PAGE_SIZE,
              search:
                nextSearch.trim(),
            },
          }
        );

      if (
        requestId !==
        offersRequestRef.current
      ) {
        return;
      }

      const data = Array.isArray(
        response.data?.data
      )
        ? response.data.data
        : [];

      setOffers(data);

      setPagination(
        response.data?.pagination || {
          page: nextPage,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 1,
        }
      );

      setPage(nextPage);
    } catch (error: any) {
      if (
        requestId !==
        offersRequestRef.current
      ) {
        return;
      }

      setLoadError(
        error?.response?.data?.error ||
          "Unable to load promotions."
      );

      setOffers([]);
    } finally {
      if (
        requestId ===
        offersRequestRef.current
      ) {
        setLoading(false);
      }
    }
  };

  const loadProducts = async (
    query = ""
  ) => {
    const requestId =
      ++productsRequestRef.current;

    try {
      const response =
        await apiClient.get(
          "/admin/products",
          {
            params: {
              page: 1,
              limit: 50,
              search:
                query.trim(),
            },
          }
        );

      if (
        requestId !==
        productsRequestRef.current
      ) {
        return;
      }

      setProducts(
        Array.isArray(
          response.data?.data
        )
          ? response.data.data
          : []
      );
    } catch {
      if (
        requestId ===
        productsRequestRef.current
      ) {
        setProducts([]);
      }
    }
  };

  useEffect(() => {
    loadOffers(1, "");

    // Initial request only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        loadOffers(1, search);
      }, 300);

    return () =>
      window.clearTimeout(timer);

    // loadOffers intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (
      !modalOpen ||
      form.applyTo !== "SELECTED"
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        loadProducts(
          productSearch
        );
      }, 250);

    return () =>
      window.clearTimeout(timer);

    // loadProducts intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modalOpen,
    form.applyTo,
    productSearch,
  ]);

  const selectedProducts =
    useMemo(
      () =>
        Object.values(
          selectedProductMap
        ).filter(
          (product) =>
            form.productIds.includes(
              product.id
            )
        ),
      [
        selectedProductMap,
        form.productIds,
      ]
    );

  const reset = () => {
    setModalOpen(false);
    setEditingId(null);
    setSaving(false);
    setFormError("");
    setProductSearch("");
    setProducts([]);
    setForm(blankForm());
    setSelectedProductMap({});
  };

  const openCreate = () => {
    setEditingId(null);
    setSaving(false);
    setFormError("");
    setProductSearch("");
    setProducts([]);
    setForm(blankForm());
    setSelectedProductMap({});
    setModalOpen(true);
  };

  const openEdit = (offer: Offer) => {
    const selected = Array.isArray(
      offer.products
    )
      ? offer.products
      : [];

    setEditingId(offer.id);

    setForm({
      name: offer.name || "",
      type: offer.type,
      value: String(
        offer.value
      ),
      applyTo:
        offer.applyTo,
      productIds:
        selected.map(
          (product) =>
            product.id
        ),
      minOrderAmount:
        offer.minOrderAmount ==
        null
          ? ""
          : String(
              offer.minOrderAmount
            ),
      couponCode:
        offer.couponCode ||
        "",
      autoApply:
        Boolean(
          offer.autoApply
        ),
      status:
        offer.status,
      startAt:
        toInputDate(
          offer.startAt
        ),
      endAt:
        toInputDate(
          offer.endAt
        ),
    });

    setSelectedProductMap(
      Object.fromEntries(
        selected.map(
          (product) => [
            product.id,
            product,
          ]
        )
      )
    );

    setFormError("");
    setProductSearch("");
    setProducts([]);
    setModalOpen(true);
  };

  const toggleProduct = (
    product: Product
  ) => {
    const checked =
      form.productIds.includes(
        product.id
      );

    setSelectedProductMap(
      (current) => ({
        ...current,
        [product.id]: {
          id: product.id,
          title:
            product.title,
        },
      })
    );

    setForm(
      (current) => ({
        ...current,
        productIds: checked
          ? current.productIds.filter(
              (id) =>
                id !==
                product.id
            )
          : [
              ...current.productIds,
              product.id,
            ],
      })
    );
  };

  const removeSelectedProduct = (
    productId: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        productIds:
          current.productIds.filter(
            (id) =>
              id !==
              productId
          ),
      })
    );

    setSelectedProductMap(
      (current) => {
        const next = {
          ...current,
        };

        delete next[
          productId
        ];

        return next;
      }
    );
  };

  const clearSelectedProducts =
    () => {
      setForm(
        (current) => ({
          ...current,
          productIds: [],
        })
      );

      setSelectedProductMap({});
    };

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setFormError("");

    const name =
      form.name.trim();

    const value =
      Number(form.value);

    const hasMinimum =
      form.minOrderAmount.trim() !== "";

    const minimum = hasMinimum
      ? Number(
          form.minOrderAmount
        )
      : undefined;

    const normalizedCoupon =
      form.couponCode
        .trim()
        .toUpperCase();

    const hasCoupon =
      normalizedCoupon.length >
      0;

    if (name.length < 3) {
      setFormError(
        "Offer name must be at least 3 characters long."
      );
      return;
    }

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      setFormError(
        "Enter a valid discount value."
      );
      return;
    }

    if (
      form.type ===
        "PERCENTAGE" &&
      value > 100
    ) {
      setFormError(
        "Percentage discount cannot exceed 100%."
      );
      return;
    }

    if (
      minimum !== undefined &&
      (!Number.isFinite(minimum) ||
        minimum < 0)
    ) {
      setFormError(
        "Enter a valid minimum order amount."
      );
      return;
    }

    if (
      hasCoupon &&
      normalizedCoupon.length > 40
    ) {
      setFormError(
        "Coupon code is too long."
      );
      return;
    }

    if (
      hasCoupon &&
      !/^[A-Z0-9_-]+$/.test(
        normalizedCoupon
      )
    ) {
      setFormError(
        "Coupon code may contain only letters, numbers, hyphens, and underscores."
      );
      return;
    }

    if (
      form.applyTo ===
        "SELECTED" &&
      form.productIds.length === 0
    ) {
      setFormError(
        "Select at least one product."
      );
      return;
    }

    if (!form.startAt) {
      setFormError(
        "Start date is required."
      );
      return;
    }

    if (!form.endAt) {
      setFormError(
        "End date is required."
      );
      return;
    }

    const start =
      new Date(
        form.startAt
      );

    const end =
      new Date(
        form.endAt
      );

    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      setFormError(
        "Please enter valid dates."
      );
      return;
    }

    if (end <= start) {
      setFormError(
        "End date must be after the start date."
      );
      return;
    }

    const payload: Record<
      string,
      unknown
    > = {
      name,
      type: form.type,
      value,
      applyTo:
        form.applyTo,
      productIds:
        form.applyTo ===
        "SELECTED"
          ? [
              ...new Set(
                form.productIds
              ),
            ]
          : [],
      autoApply:
        form.autoApply,
      status:
        form.status,
      startAt:
        toIso(form.startAt),
      endAt:
        toIso(form.endAt),
    };

    /*
     * IMPORTANT:
     * Do not send null for these optional fields.
     * The corrected Zod validator accepts omitted/undefined
     * values and normalizes legacy null safely on the server.
     */
    if (
      minimum !== undefined
    ) {
      payload.minOrderAmount =
        minimum;
    }

    if (hasCoupon) {
      payload.couponCode =
        normalizedCoupon;
    }

    setSaving(true);

    try {
      if (editingId) {
        await apiClient.put(
          `/offers/admin/${editingId}`,
          payload
        );
      } else {
        await apiClient.post(
          "/offers/admin",
          payload
        );
      }

      await loadOffers(
        editingId ? page : 1,
        search
      );

      reset();
    } catch (error: any) {
      const details =
        error?.response
          ?.data?.details;

      if (
        Array.isArray(details) &&
        details.length > 0
      ) {
        setFormError(
          details
            .map(
              (item: {
                field?: string;
                message?: string;
              }) =>
                item.message ||
                item.field ||
                ""
            )
            .filter(Boolean)
            .join(" ")
        );
      } else {
        setFormError(
          error?.response
            ?.data?.error ||
            "Failed to save offer."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (
    id: string
  ) => {
    if (deletingId) {
      return;
    }

    const offer =
      offers.find(
        (item) =>
          item.id === id
      );

    const confirmed =
      window.confirm(
        `Delete${
          offer
            ? ` "${offer.name}"`
            : ""
        }?\n\nThis cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    try {
      await apiClient.delete(
        `/offers/admin/${id}`
      );

      const nextPage =
        offers.length === 1 &&
        page > 1
          ? page - 1
          : page;

      await loadOffers(
        nextPage,
        search
      );
    } catch (error: any) {
      setLoadError(
        error?.response
          ?.data?.error ||
          "Failed to delete offer."
      );
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const onKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
          "Escape" &&
        !saving
      ) {
        reset();
        return;
      }

      if (
        event.key !==
          "Tab" ||
        !modalRef.current
      ) {
        return;
      }

      const focusable =
        Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (element) =>
            !element.hasAttribute(
              "disabled"
            ) &&
            element.getAttribute(
              "aria-hidden"
            ) !== "true"
        );

      if (!focusable.length) {
        return;
      }

      const first =
        focusable[0];

      const last =
        focusable[
          focusable.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement ===
          first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement ===
          last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    const focusTimer =
      window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);

    return () => {
      window.clearTimeout(
        focusTimer
      );

      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [modalOpen, saving]);

  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>
        <header
          className={styles.header}
        >
          <div>
            <p
              className={
                styles.eyebrow
              }
            >
              PLUTEN / PROMOTIONS
            </p>

            <h1>Offers</h1>

            <p
              className={
                styles.subtitle
              }
            >
              Create precise,
              product-level
              discounts without
              touching checkout
              code.
            </p>
          </div>

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={
              openCreate
            }
          >
            <Plus size={18} />
            Create offer
          </button>
        </header>

        <div
          className={
            styles.searchBox
          }
          style={{
            marginBottom: 18,
          }}
        >
          <Search size={16} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search offers, coupons or products..."
            aria-label="Search offers"
          />
        </div>

        {loading ? (
          <div
            className={
              styles.loading
            }
          >
            <Loader2
              className={
                styles.spin
              }
              size={30}
            />

            <span>
              Loading
              promotions
            </span>
          </div>
        ) : loadError ? (
          <div
            className={
              styles.errorState
            }
          >
            <AlertCircle
              size={22}
            />

            <h2>
              Promotions
              unavailable.
            </h2>

            <p>
              {loadError}
            </p>

            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={() =>
                loadOffers(
                  page,
                  search
                )
              }
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div
              className={
                styles.summary
              }
            >
              <span>
                <strong>
                  {
                    pagination.total
                  }
                </strong>{" "}
                total offers
              </span>

              <span>
                <strong>
                  {
                    offers.filter(
                      (
                        offer
                      ) =>
                        offer.status ===
                        "ACTIVE"
                    ).length
                  }
                </strong>{" "}
                active on this
                page
              </span>
            </div>

            {offers.length ===
            0 ? (
              <div
                className={
                  styles.empty
                }
              >
                <Tag size={22} />

                <h2>
                  No offers
                  found.
                </h2>

                <p>
                  Create your
                  first promotion
                  or change the
                  search.
                </p>

                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  onClick={
                    openCreate
                  }
                >
                  <Plus size={17} />
                  Create offer
                </button>
              </div>
            ) : (
              <div
                className={
                  styles.tableCard
                }
              >
                <div
                  className={
                    styles.tableScroll
                  }
                >
                  <table>
                    <thead>
                      <tr>
                        <th>
                          Offer
                        </th>
                        <th>
                          Discount
                        </th>
                        <th>
                          Applies to
                        </th>
                        <th>
                          Status
                        </th>
                        <th>
                          Valid until
                        </th>
                        <th>
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {offers.map(
                        (offer) => (
                          <tr
                            key={
                              offer.id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  offer.name
                                }
                              </strong>

                              {offer.autoApply && (
                                <span
                                  className={
                                    styles.autoPill
                                  }
                                >
                                  Auto
                                </span>
                              )}
                            </td>

                            <td>
                              {offer.type ===
                              "PERCENTAGE"
                                ? `${offer.value}% OFF`
                                : `₹${Number(
                                    offer.value
                                  ).toLocaleString(
                                    "en-IN"
                                  )} OFF`}
                            </td>

                            <td>
                              {offer.applyTo ===
                              "ALL"
                                ? "All products"
                                : `${
                                    Array.isArray(
                                      offer.products
                                    )
                                      ? offer
                                          .products
                                          .length
                                      : 0
                                  } selected`}
                            </td>

                            <td>
                              <span
                                className={`${styles.status} ${
                                  styles[
                                    offer.status.toLowerCase()
                                  ]
                                }`}
                              >
                                {
                                  offer.status
                                }
                              </span>
                            </td>

                            <td>
                              {new Date(
                                offer.endAt
                              ).toLocaleString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month:
                                    "short",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute:
                                    "2-digit",
                                }
                              )}
                            </td>

                            <td>
                              <div
                                className={
                                  styles.rowActions
                                }
                              >
                                <button
                                  type="button"
                                  className={
                                    styles.iconButton
                                  }
                                  onClick={() =>
                                    openEdit(
                                      offer
                                    )
                                  }
                                  aria-label={`Edit ${offer.name}`}
                                >
                                  <Edit2
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <button
                                  type="button"
                                  className={`${styles.iconButton} ${styles.danger}`}
                                  onClick={() =>
                                    remove(
                                      offer.id
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    offer.id
                                  }
                                  aria-label={`Delete ${offer.name}`}
                                >
                                  {deletingId ===
                                  offer.id ? (
                                    <Loader2
                                      className={
                                        styles.spin
                                      }
                                      size={
                                        16
                                      }
                                    />
                                  ) : (
                                    <Trash2
                                      size={
                                        16
                                      }
                                    />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                marginTop: 16,
                gap: 12,
                color: "#777",
                fontSize: 11,
              }}
            >
              <span>
                Page{" "}
                {
                  pagination.page
                }{" "}
                of{" "}
                {
                  pagination.totalPages
                }
              </span>

              <div
                style={{
                  display:
                    "flex",
                  gap: 6,
                }}
              >
                <button
                  type="button"
                  className={
                    styles.iconButton
                  }
                  disabled={
                    pagination.page <=
                      1 ||
                    loading
                  }
                  onClick={() =>
                    loadOffers(
                      pagination.page -
                        1,
                      search
                    )
                  }
                  aria-label="Previous offers page"
                >
                  <ChevronLeft
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  className={
                    styles.iconButton
                  }
                  disabled={
                    pagination.page >=
                      pagination.totalPages ||
                    loading
                  }
                  onClick={() =>
                    loadOffers(
                      pagination.page +
                        1,
                      search
                    )
                  }
                  aria-label="Next offers page"
                >
                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-editor-title"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              reset();
            }
          }}
        >
          <div
            ref={modalRef}
            className={styles.modal}
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <p
                  className={
                    styles.eyebrow
                  }
                >
                  PLUTEN / OFFER ENGINE
                </p>

                <h2 id="offer-editor-title">
                  {editingId
                    ? "Edit offer"
                    : "Create offer"}
                </h2>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className={
                  styles.closeButton
                }
                onClick={reset}
                disabled={saving}
                aria-label="Close offer editor"
              >
                <X size={19} />
              </button>
            </div>

            {formError && (
              <div
                className={
                  styles.formError
                }
              >
                <AlertCircle
                  size={16}
                />
                {formError}
              </div>
            )}

            <form
              className={styles.form}
              onSubmit={submit}
            >
              <div
                className={
                  styles.field
                }
              >
                <label>
                  Offer name
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        name: event
                          .target
                          .value,
                      })
                    )
                  }
                  placeholder="e.g. Launch week"
                  autoFocus
                  disabled={saving}
                />
              </div>

              <div
                className={
                  styles.twoCol
                }
              >
                <div
                  className={
                    styles.field
                  }
                >
                  <label>
                    Discount type
                  </label>

                  <select
                    value={
                      form.type
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,
                          type:
                            event
                              .target
                              .value as DiscountType,
                        })
                      )
                    }
                    disabled={saving}
                  >
                    <option value="PERCENTAGE">
                      Percentage
                    </option>

                    <option value="FIXED">
                      Fixed amount
                    </option>
                  </select>
                </div>

                <div
                  className={
                    styles.field
                  }
                >
                  <label>
                    {form.type ===
                    "PERCENTAGE"
                      ? "Discount %"
                      : "Discount amount"}
                  </label>

                  <input
                    inputMode="decimal"
                    value={
                      form.value
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          value:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="20"
                    disabled={saving}
                  />
                </div>
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>
                  Applies to
                </label>

                <div
                  className={
                    styles.segmented
                  }
                >
                  <button
                    type="button"
                    className={
                      form.applyTo ===
                      "ALL"
                        ? styles.segmentActive
                        : styles.segment
                    }
                    onClick={() =>
                      setForm(
                        (current) => ({
                          ...current,
                          applyTo:
                            "ALL",
                          productIds:
                            [],
                        })
                      )
                    }
                    disabled={saving}
                  >
                    All products
                  </button>

                  <button
                    type="button"
                    className={
                      form.applyTo ===
                      "SELECTED"
                        ? styles.segmentActive
                        : styles.segment
                    }
                    onClick={() =>
                      setForm(
                        (current) => ({
                          ...current,
                          applyTo:
                            "SELECTED",
                        })
                      )
                    }
                    disabled={saving}
                  >
                    Selected
                    products
                  </button>
                </div>
              </div>

              {form.applyTo ===
                "SELECTED" && (
                <div
                  className={
                    styles.productPicker
                  }
                >
                  <div
                    className={
                      styles.searchBox
                    }
                  >
                    <Search size={16} />

                    <input
                      value={
                        productSearch
                      }
                      onChange={(event) =>
                        setProductSearch(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search products..."
                      aria-label="Search products"
                      disabled={saving}
                    />
                  </div>

                  <div
                    className={
                      styles.selectionHeader
                    }
                  >
                    <span>
                      <strong>
                        {
                          form
                            .productIds
                            .length
                        }
                      </strong>{" "}
                      selected
                    </span>

                    <button
                      type="button"
                      onClick={
                        clearSelectedProducts
                      }
                      disabled={
                        saving ||
                        form
                          .productIds
                          .length ===
                          0
                      }
                    >
                      Clear
                    </button>
                  </div>

                  <div
                    className={
                      styles.productList
                    }
                  >
                    {products.length ===
                    0 ? (
                      <p
                        className={
                          styles.noResults
                        }
                      >
                        No products found.
                      </p>
                    ) : (
                      products.map(
                        (product) => {
                          const checked =
                            form.productIds.includes(
                              product.id
                            );

                          return (
                            <button
                              key={
                                product.id
                              }
                              type="button"
                              className={
                                checked
                                  ? styles.productOptionActive
                                  : styles.productOption
                              }
                              onClick={() =>
                                toggleProduct(
                                  product
                                )
                              }
                              disabled={
                                saving
                              }
                            >
                              <span
                                className={
                                  styles.checkbox
                                }
                              >
                                {checked ? (
                                  <Check
                                    size={
                                      14
                                    }
                                  />
                                ) : null}
                              </span>

                              <span
                                className={
                                  styles.productOptionText
                                }
                              >
                                <strong>
                                  {
                                    product.title
                                  }
                                </strong>

                                <small>
                                  ₹
                                  {Number(
                                    product.price
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </small>
                              </span>
                            </button>
                          );
                        }
                      )
                    )}
                  </div>

                  {selectedProducts.length >
                    0 && (
                    <div
                      className={
                        styles.selectedSummary
                      }
                    >
                      {selectedProducts.map(
                        (product) => (
                          <span
                            key={
                              product.id
                            }
                          >
                            {
                              product.title
                            }

                            <button
                              type="button"
                              onClick={() =>
                                removeSelectedProduct(
                                  product.id
                                )
                              }
                              disabled={
                                saving
                              }
                              aria-label={`Remove ${product.title}`}
                            >
                              <X
                                size={
                                  12
                                }
                              />
                            </button>
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              <div
                className={
                  styles.twoCol
                }
              >
                <div
                  className={
                    styles.field
                  }
                >
                  <label>
                    Minimum order
                  </label>

                  <input
                    inputMode="decimal"
                    value={
                      form.minOrderAmount
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          minOrderAmount:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Optional"
                    disabled={saving}
                  />
                </div>

                <div
                  className={
                    styles.field
                  }
                >
                  <label>
                    Coupon code
                  </label>

                  <input
                    value={
                      form.couponCode
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          couponCode:
                            event
                              .target
                              .value
                              .toUpperCase()
                              .replace(
                                /\s/g,
                                ""
                              )
                              .slice(
                                0,
                                40
                              ),
                        })
                      )
                    }
                    placeholder="Optional"
                    maxLength={40}
                    disabled={saving}
                  />
                </div>
              </div>

              <div
                className={
                  styles.twoCol
                }
              >
                <div
                  className={
                    styles.field
                  }
                >
                  <label>
                    Start
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.startAt
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          startAt:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div
                  className={
                    styles.field
                  }
                >
                  <label>
                    End
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.endAt
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          endAt:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    disabled={saving}
                  />
                </div>
              </div>

              <div
                className={
                  styles.switchRow
                }
              >
                <div>
                  <strong>
                    Auto apply
                  </strong>

                  <span>
                    Use automatically
                    when this offer
                    is eligible.
                  </span>
                </div>

                <button
                  type="button"
                  aria-pressed={
                    form.autoApply
                  }
                  className={
                    form.autoApply
                      ? styles.switchOn
                      : styles.switchOff
                  }
                  onClick={() =>
                    setForm(
                      (current) => ({
                        ...current,
                        autoApply:
                          !current.autoApply,
                      })
                    )
                  }
                  disabled={saving}
                  aria-label={
                    form.autoApply
                      ? "Disable automatic application"
                      : "Enable automatic application"
                  }
                >
                  <span />
                </button>
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>
                  Status
                </label>

                <select
                  value={
                    form.status
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        status:
                          event
                            .target
                            .value as Status,
                      })
                    )
                  }
                  disabled={saving}
                >
                  <option value="DRAFT">
                    Draft
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="PAUSED">
                    Paused
                  </option>

                  <option value="EXPIRED">
                    Expired
                  </option>
                </select>
              </div>

              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={reset}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    styles.primaryButton
                  }
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2
                        className={
                          styles.spin
                        }
                        size={17}
                      />
                      Saving
                    </>
                  ) : editingId ? (
                    "Save changes"
                  ) : (
                    "Create offer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}