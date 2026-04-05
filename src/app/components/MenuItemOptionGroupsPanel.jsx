'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/app/lib/apiErrorMessage';
import { formatOptionDelta } from '@/app/lib/currency';

function extractGroups(data) {
  const payload = data?.data && typeof data.data === 'object' ? data.data : data;
  const raw = payload?.option_groups ?? payload?.optionGroups ?? [];
  return Array.isArray(raw) ? raw : [];
}

function sortByDisplayOrder(list) {
  return [...list].sort(
    (a, b) => (Number(a?.display_order) || 0) - (Number(b?.display_order) || 0)
  );
}

/** Spec §1.4 — selection part only (Required/Optional shown separately from `is_required`). */
function optionGroupSelectionText(min, max) {
  const mi = Math.max(0, Number(min) || 0);
  const ma = Math.max(1, Number(max) || 1);
  if (mi === ma && mi === 1) return 'Pick exactly 1';
  if (mi === ma) return `Pick exactly ${mi}`;
  if (mi === 0 && ma === 1) return 'Pick up to 1';
  if (mi === 0) return `Pick up to ${ma}`;
  return `Pick ${mi} to ${ma}`;
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MenuItemOptionGroupsPanel({ menuItemId }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupModal, setGroupModal] = useState({ open: false, editing: null });
  const [optionModal, setOptionModal] = useState({ open: false, groupId: null, editing: null });

  const fetchGroups = useCallback(async () => {
    if (!menuItemId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/restaurants/menu-items/${menuItemId}/option-groups`,
        { headers: authHeaders() }
      );
      setGroups(sortByDisplayOrder(extractGroups(data)));
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? apiErrorMessage(e, 'Failed to load option groups')
        : e?.message || 'Failed to load option groups';
      toast.error(msg);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [menuItemId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const openAddGroup = () =>
    setGroupModal({
      open: true,
      editing: null,
      name: '',
      is_required: false,
      min_selections: 0,
      max_selections: 1,
      error: '',
    });

  const openEditGroup = (g) =>
    setGroupModal({
      open: true,
      editing: g,
      name: g.name || '',
      is_required: Boolean(g.is_required),
      min_selections: Number(g.min_selections) || 0,
      max_selections: Math.max(1, Number(g.max_selections) || 1),
      error: '',
    });

  const saveGroup = async () => {
    const m = groupModal;
    if (!m.open) return;
    const name = String(m.name || '').trim();
    if (!name) {
      setGroupModal((prev) => ({ ...prev, error: 'Group name is required.' }));
      return;
    }
    let minSel = Math.max(0, Number(m.min_selections) || 0);
    let maxSel = Math.max(1, Number(m.max_selections) || 1);
    if (m.is_required && minSel < 1) minSel = 1;
    if (minSel > maxSel) {
      setGroupModal((prev) => ({ ...prev, error: 'Minimum cannot exceed maximum.' }));
      return;
    }
    try {
      if (m.editing) {
        await axios.patch(
          `/api/restaurants/menu-items/${menuItemId}/option-groups/${m.editing.id}`,
          {
            name,
            is_required: m.is_required,
            min_selections: minSel,
            max_selections: maxSel,
            display_order: Number(m.editing.display_order) || 0,
          },
          { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
        );
        toast.success('Option group updated.');
      } else {
        await axios.post(
          `/api/restaurants/menu-items/${menuItemId}/option-groups`,
          {
            name,
            is_required: m.is_required,
            min_selections: minSel,
            max_selections: maxSel,
            display_order: groups.length,
          },
          { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
        );
        toast.success('Option group created.');
      }
      setGroupModal({ open: false, editing: null });
      await fetchGroups();
    } catch (e) {
      toast.error(axios.isAxiosError(e) ? apiErrorMessage(e, 'Failed to save group') : e?.message || 'Failed to save group');
    }
  };

  const deleteGroup = async (g) => {
    const opts = Array.isArray(g.options) ? g.options : [];
    const n = opts.length;
    const ok = window.confirm(
      `Delete "${g.name}"? All ${n} option(s) inside will also be deleted. This cannot be undone.`
    );
    if (!ok) return;
    try {
      await axios.delete(`/api/restaurants/menu-items/${menuItemId}/option-groups/${g.id}`, {
        headers: authHeaders(),
      });
      toast.success('Option group deleted.');
      await fetchGroups();
    } catch (e) {
      const msg = axios.isAxiosError(e)
        ? e.response?.data?.message || e.message
        : e?.message || 'Failed to delete group';
      toast.error(typeof msg === 'string' ? msg : 'Failed to delete group');
    }
  };

  const openAddOption = (groupId) =>
    setOptionModal({
      open: true,
      groupId,
      editing: null,
      name: '',
      additional_price: 0,
      is_available: true,
      error: '',
    });

  const openEditOption = (groupId, opt) =>
    setOptionModal({
      open: true,
      groupId,
      editing: opt,
      name: opt.name || '',
      additional_price: Number(opt.additional_price) || 0,
      is_available: opt.is_available !== false && opt.is_available !== 0,
      error: '',
    });

  const saveOption = async () => {
    const m = optionModal;
    if (!m.open || !m.groupId) return;
    const name = String(m.name || '').trim();
    if (!name) {
      setOptionModal((prev) => ({ ...prev, error: 'Option name is required.' }));
      return;
    }
    const price = Math.max(0, Number(m.additional_price) || 0);
    try {
      if (m.editing) {
        await axios.patch(
          `/api/restaurants/menu-items/${menuItemId}/option-groups/${m.groupId}/options/${m.editing.id}`,
          { name, additional_price: price, is_available: m.is_available },
          { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
        );
        toast.success('Option updated.');
      } else {
        const grp = groups.find((g) => g.id === m.groupId);
        const ord = Array.isArray(grp?.options) ? grp.options.length : 0;
        await axios.post(
          `/api/restaurants/menu-items/${menuItemId}/option-groups/${m.groupId}/options`,
          {
            name,
            additional_price: price,
            is_available: m.is_available,
            display_order: ord,
          },
          { headers: { ...authHeaders(), 'Content-Type': 'application/json' } }
        );
        toast.success('Option added.');
      }
      setOptionModal({ open: false, groupId: null, editing: null });
      await fetchGroups();
    } catch (e) {
      toast.error(axios.isAxiosError(e) ? apiErrorMessage(e, 'Failed to save option') : e?.message || 'Failed to save option');
    }
  };

  const deleteOption = async (group, opt) => {
    const opts = sortByDisplayOrder(Array.isArray(group.options) ? group.options : []);
    const isLast = opts.length <= 1;
    const isRequired = Boolean(group.is_required);
    let msg = `Delete "${opt.name}"?`;
    if (isRequired && isLast) {
      msg =
        'This group is required — add at least one option or customers won\'t be able to order this item.\n\nDelete anyway?';
    }
    if (!window.confirm(msg)) return;
    try {
      await axios.delete(
        `/api/restaurants/menu-items/${menuItemId}/option-groups/${group.id}/options/${opt.id}`,
        { headers: authHeaders() }
      );
      toast.success('Option deleted.');
      await fetchGroups();
    } catch (e) {
      toast.error(axios.isAxiosError(e) ? apiErrorMessage(e, 'Failed to delete option') : e?.message || 'Failed to delete option');
    }
  };

  useEffect(() => {
    if (!groupModal.open && !optionModal.open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setGroupModal({ open: false, editing: null });
        setOptionModal({ open: false, groupId: null, editing: null });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [groupModal.open, optionModal.open]);

  const closeGroupModal = () => setGroupModal({ open: false, editing: null });
  const closeOptionModal = () => setOptionModal({ open: false, groupId: null, editing: null });

  if (!menuItemId) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold text-[#1E1E24]">Options &amp; Add-ons</h3>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Configure sizes and extras. Saved immediately when you add or edit a group or option.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddGroup}
          className="inline-flex items-center gap-1 rounded-lg bg-[#7C3AED] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
        >
          <Plus size={14} />
          Add group
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-xs text-gray-500">Loading option groups…</p>
      ) : groups.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center text-xs text-gray-500">
          No option groups yet. Use <span className="font-semibold text-[#7C3AED]">Add group</span> to create
          sizes or add-ons.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {groups.map((g) => {
            const opts = sortByDisplayOrder(Array.isArray(g.options) ? g.options : []);
            return (
              <li
                key={g.id}
                className="rounded-lg border border-gray-200 bg-[#FAFAFF] p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1E1E24]">{g.name || 'Untitled group'}</p>
                    <p className="mt-0.5 text-[11px] text-gray-600">
                      <span
                        className={
                          g.is_required
                            ? 'font-medium text-amber-800'
                            : 'font-medium text-slate-600'
                        }
                      >
                        {g.is_required ? 'Required' : 'Optional'}
                      </span>
                      <span className="text-gray-400"> · </span>
                      <span>{optionGroupSelectionText(g.min_selections, g.max_selections)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEditGroup(g)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGroup(g)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      aria-label="Delete group"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {opts.length === 0 ? (
                  <p className="mt-3 text-[11px] text-gray-500">
                    No options yet. Add your first option.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-100 bg-white">
                    {opts.map((opt) => (
                      <li
                        key={opt.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 text-sm"
                      >
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="text-gray-800">{opt.name}</span>
                          <span className="text-xs text-gray-500">{formatOptionDelta(opt.additional_price)}</span>
                          {opt.is_available === false || opt.is_available === 0 ? (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              Hidden
                            </span>
                          ) : null}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEditOption(g.id, opt)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                            aria-label="Edit option"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteOption(g, opt)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-red-100 text-red-600 hover:bg-red-50"
                            aria-label="Delete option"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => openAddOption(g.id)}
                  className="mt-2 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  + Add option
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {groupModal.open ? (
        <div
          role="presentation"
          className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/50 p-4"
          onClick={closeGroupModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="option-group-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="option-group-modal-title" className="text-sm font-semibold text-[#1E1E24]">
              {groupModal.editing ? 'Edit option group' : 'Add option group'}
            </h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Group name *</label>
                <input
                  value={groupModal.name}
                  onChange={(e) => setGroupModal((p) => ({ ...p, name: e.target.value, error: '' }))}
                  placeholder="e.g. Choose Size"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#7C3AED] focus:outline-none"
                />
              </div>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={groupModal.is_required}
                  onChange={(e) =>
                    setGroupModal((p) => ({
                      ...p,
                      is_required: e.target.checked,
                      min_selections: e.target.checked ? Math.max(1, p.min_selections || 1) : p.min_selections,
                      error: '',
                    }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Required</span>
                  <span className="block text-[11px] font-normal text-gray-500">
                    Customer must make a selection from this group
                  </span>
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Min selections</label>
                  <input
                    type="number"
                    min={0}
                    value={groupModal.min_selections}
                    onChange={(e) =>
                      setGroupModal((p) => ({
                        ...p,
                        min_selections: Number(e.target.value),
                        error: '',
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-700">Max selections</label>
                  <input
                    type="number"
                    min={1}
                    value={groupModal.max_selections}
                    onChange={(e) =>
                      setGroupModal((p) => ({
                        ...p,
                        max_selections: Math.max(1, Number(e.target.value) || 1),
                        error: '',
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Max = 1 → radio style in app. Max &gt; 1 → multiple selection.
              </p>
              {groupModal.error ? <p className="text-xs text-red-600">{groupModal.error}</p> : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeGroupModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveGroup}
                className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
              >
                Save group
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {optionModal.open ? (
        <div
          role="presentation"
          className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/50 p-4"
          onClick={closeOptionModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="option-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="option-modal-title" className="text-sm font-semibold text-[#1E1E24]">
              {optionModal.editing ? 'Edit option' : 'Add option'}
            </h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700">Option name *</label>
                <input
                  value={optionModal.name}
                  onChange={(e) => setOptionModal((p) => ({ ...p, name: e.target.value, error: '' }))}
                  placeholder="e.g. Large"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#7C3AED] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  Additional price (IQD)
                </label>
                <input
                  type="number"
                  min={0}
                  value={optionModal.additional_price}
                  onChange={(e) =>
                    setOptionModal((p) => ({
                      ...p,
                      additional_price: Math.max(0, Number(e.target.value) || 0),
                      error: '',
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#7C3AED] focus:outline-none"
                />
                <p className="mt-0.5 text-[11px] text-gray-500">Leave 0 for no extra charge</p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={optionModal.is_available}
                  onChange={(e) => setOptionModal((p) => ({ ...p, is_available: e.target.checked }))}
                />
                Available
              </label>
              {optionModal.error ? <p className="text-xs text-red-600">{optionModal.error}</p> : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeOptionModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOption}
                className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
              >
                Save option
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
