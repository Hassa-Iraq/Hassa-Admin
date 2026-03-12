'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Download, Pencil, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';

export default function SubCategoryListPage() {
  const router = useRouter();
  const [mainCategories, setMainCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const toAbsoluteAssetUrl = (value) => {
      if (!value || typeof value !== 'string') return '';
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      if (trimmed.startsWith('//')) return `https:${trimmed}`;
      if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
      return `${API_BASE_URL}/${trimmed}`;
    };

    const resolveText = (...values) =>
      values.find((value) => typeof value === 'string' && value.trim().length > 0) || '';

    const normalizeImage = (value) => {
      if (Array.isArray(value)) {
        for (const item of value) {
          const candidate = normalizeImage(item);
          if (candidate) return candidate;
        }
        return '';
      }
      if (typeof value === 'string' && value.trim()) return toAbsoluteAssetUrl(value);
      if (value && typeof value === 'object') {
        const pathWithKey =
          value.path && value.key
            ? `${String(value.path).replace(/\/$/, '')}/${String(value.key).replace(/^\//, '')}`
            : '';

        return (
          normalizeImage(value.full_url) ||
          normalizeImage(value.url) ||
          normalizeImage(pathWithKey) ||
          normalizeImage(value.path) ||
          normalizeImage(value.key) ||
          normalizeImage(value.image) ||
          ''
        );
      }
      return '';
    };

    const collectSubcategories = (category) => {
      const collections = [
        category?.subcategories,
        category?.sub_categories,
        category?.subCategories,
        category?.children,
      ];
      const firstArray = collections.find((value) => Array.isArray(value));
      return Array.isArray(firstArray) ? firstArray : [];
    };

    const normalizeCategory = (item, index) => ({
      id: String(item?.id ?? item?.category_id ?? item?.menu_category_id ?? `category-${index}`),
      parentId: item?.parent_id ? String(item.parent_id) : '',
      name: resolveText(item?.name, item?.title, 'N/A'),
      description: resolveText(item?.description, item?.details, ''),
      image:
        normalizeImage(item?.image_url) ||
        normalizeImage(item?.image) ||
        normalizeImage(item?.image_full_url) ||
        normalizeImage(item?.photo) ||
        '',
    });

    const normalizeSubcategory = (item, parentCategory, index) => {
      const id = String(item?.id ?? item?.category_id ?? item?.menu_category_id ?? `${parentCategory?.id || 'p'}-${index}`);
      return {
        id,
        parentCategoryId: String(parentCategory?.id || item?.parent_id || ''),
        parentCategoryName: resolveText(parentCategory?.name, item?.parent_name, item?.category_name, 'N/A'),
        name: resolveText(item?.name, item?.title, 'N/A'),
        description: resolveText(item?.description, item?.details, ''),
        image:
          normalizeImage(item?.image_url) ||
          normalizeImage(item?.image) ||
          normalizeImage(item?.image_full_url) ||
          normalizeImage(item?.photo) ||
          '',
      };
    };

    const fetchSubcategories = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const restaurantId =
          localStorage.getItem('restaurant_id') ||
          localStorage.getItem('selectedRestaurantId') ||
          '';
        const token = localStorage.getItem('token') || '';

        if (!restaurantId) {
          setMainCategories([]);
          setSubcategories([]);
          setFetchError('Restaurant ID not found. Please select restaurant first.');
          return;
        }

        const params = new URLSearchParams({
          restaurant_id: restaurantId,
          page: '1',
          limit: '500',
        });

        const { data } = await axios.get(`/api/restaurants/categories?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const categoriesList =
          payload?.categories ||
          payload?.list ||
          data?.categories ||
          data?.list ||
          payload ||
          [];
        const rawCategories = Array.isArray(categoriesList) ? categoriesList : [];
        const normalizedCategories = rawCategories.map(normalizeCategory).filter((item) => Boolean(item.id));
        const normalizedById = new Map(
          normalizedCategories.map((category) => [String(category.id), category])
        );

        const topLevelCategories = normalizedCategories.filter((item) => !item.parentId);
        setMainCategories(topLevelCategories);

        const nestedRows = rawCategories.flatMap((rawCategory) => {
          const parentId = String(rawCategory?.id || '');
          const parentCategory = normalizedById.get(parentId) || null;
          return collectSubcategories(rawCategory).map((sub, index) =>
            normalizeSubcategory(sub, parentCategory, index)
          );
        });

        const fallbackRows = normalizedCategories
          .filter((category) => Boolean(category.parentId))
          .map((subcategory) => {
            const parentCategory = normalizedById.get(String(subcategory.parentId)) || null;
            return {
              id: subcategory.id,
              parentCategoryId: String(subcategory.parentId || ''),
              parentCategoryName: resolveText(parentCategory?.name, 'N/A'),
              name: subcategory.name,
              description: subcategory.description,
              image: subcategory.image,
            };
          });

        const mergedRows = [...nestedRows];
        const seen = new Set(mergedRows.map((item) => String(item.id)));
        fallbackRows.forEach((item) => {
          const key = String(item.id);
          if (!seen.has(key)) {
            seen.add(key);
            mergedRows.push(item);
          }
        });

        setSubcategories(mergedRows);
      } catch (error) {
        setMainCategories([]);
        setSubcategories([]);
        setFetchError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Failed to load sub-categories'
            : error?.message || 'Failed to load sub-categories'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, []);

  const groupedRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    const categoryById = new Map(mainCategories.map((category) => [String(category.id), category]));
    const groups = mainCategories.map((category) => ({
      category,
      subcategories: subcategories.filter((item) => String(item.parentCategoryId) === String(category.id)),
    }));

    const orphanByParent = new Map();
    subcategories.forEach((item) => {
      if (categoryById.has(String(item.parentCategoryId))) return;
      const parentId = String(item.parentCategoryId || 'unknown');
      if (!orphanByParent.has(parentId)) {
        orphanByParent.set(parentId, {
          category: {
            id: parentId,
            parentId: '',
            name: item.parentCategoryName || 'Unknown Category',
            description: '',
            image: '',
          },
          subcategories: [],
        });
      }
      orphanByParent.get(parentId).subcategories.push(item);
    });

    const allGroups = [...groups, ...Array.from(orphanByParent.values())];
    if (!query) return allGroups;

    return allGroups.filter((group) => {
      const categoryMatch =
        String(group.category.name || '').toLowerCase().includes(query) ||
        String(group.category.description || '').toLowerCase().includes(query);
      if (categoryMatch) return true;
      return group.subcategories.some((item) =>
        String(item.name || '').toLowerCase().includes(query) ||
        String(item.description || '').toLowerCase().includes(query)
      );
    }).map((group) => {
      const categoryMatch =
        String(group.category.name || '').toLowerCase().includes(query) ||
        String(group.category.description || '').toLowerCase().includes(query);
      if (categoryMatch) return group;
      return {
        ...group,
        subcategories: group.subcategories.filter((item) =>
          String(item.name || '').toLowerCase().includes(query) ||
          String(item.description || '').toLowerCase().includes(query)
        ),
      };
    });
  }, [mainCategories, search, subcategories]);

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!subcategoryId) return;
    const confirmed = window.confirm('Are you sure you want to delete this subcategory?');
    if (!confirmed) return;

    try {
      setDeletingId(String(subcategoryId));
      setFetchError('');
      const token = localStorage.getItem('token') || '';

      await axios.delete(`/api/restaurants/categories/${subcategoryId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setSubcategories((prev) => prev.filter((item) => String(item.id) !== String(subcategoryId)));
    } catch (error) {
      setFetchError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to delete subcategory'
          : error?.message || 'Failed to delete subcategory'
      );
    } finally {
      setDeletingId('');
    }
  };

  const totalSubcategories = groupedRows.reduce((sum, group) => sum + group.subcategories.length, 0);

  return (
    <div className="pt-36 pb-8">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search any category..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Download size={12} />
              <span>Export</span>
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <SlidersHorizontal size={12} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Image</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Subcategory Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Description</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <TableLoadingSkeleton colSpan={5} rows={8} />
              )}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-red-500">
                    {fetchError}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && groupedRows.map((group, groupIndex) => (
                <Fragment key={`${group.category.id}-${groupIndex}`}>
                  <tr className="border-y border-[#E9D5FF] bg-[#FAF5FF]">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 overflow-hidden rounded-lg bg-purple-100">
                            <img
                              src={group.category.image || null}
                              alt={group.category.name}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.style.visibility = 'hidden';
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#1E1E24]">
                              Category: {group.category.name}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] font-medium text-[#7C3AED]">
                          Subcategories: {group.subcategories.length}
                        </p>
                      </div>
                    </td>
                  </tr>

                  {group.subcategories.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-4 py-3 text-xs text-gray-500">{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="h-7 w-7 overflow-hidden rounded-lg bg-purple-100">
                          <img
                            src={item.image || null}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.style.visibility = 'hidden';
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.name}</td>
                      <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.description || '-'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/foods/sub-categories/add?category_id=${item.id}`)}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#7C3AED] bg-[#F8F4FF] text-[#7C3AED]"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubcategory(item.id)}
                            disabled={deletingId === String(item.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {group.subcategories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-xs text-gray-400">
                        No subcategories in this category.
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}

              {!loading && !fetchError && totalSubcategories === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    No sub-categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
