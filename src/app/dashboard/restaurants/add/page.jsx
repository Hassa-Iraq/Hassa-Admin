'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, MapPin, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import PhoneCodeSelect from '@/app/components/PhoneCodeSelect';
import { toast } from 'sonner';

const INITIAL_FORM = {
  restaurantName: '',
  zone: '',
  cuisine: '',
  radius: '',
  latitude: '',
  longitude: '',
  minDeliveryTime: '',
  maxDeliveryTime: '',
  deliveryTimeUnit: 'Minutes',
  firstName: '',
  lastName: '',
  phone: '',
  phoneCode: '+1',
  tags: '',
  tinNumber: '',
  tinExpiry: '',
  additionalTin: '',
  additionalDate: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const PHONE_CODE_OPTIONS = [
  { value: '+1', code: 'US', flagUrl: 'https://flagcdn.com/w20/us.png' },
  { value: '+44', code: 'GB', flagUrl: 'https://flagcdn.com/w20/gb.png' },
  { value: '+92', code: 'PK', flagUrl: 'https://flagcdn.com/w20/pk.png' },
  { value: '+966', code: 'SA', flagUrl: 'https://flagcdn.com/w20/sa.png' },
  { value: '+971', code: 'AE', flagUrl: 'https://flagcdn.com/w20/ae.png' },
  { value: '+964', code: 'IQ', flagUrl: 'https://flagcdn.com/w20/iq.png' },
];

export default function AddRestaurantPage() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [parentRestaurantId, setParentRestaurantId] = useState('');
  const [branchOwnerContact, setBranchOwnerContact] = useState({ email: '', phone: '' });
  const isEditMode = Boolean(restaurantId);
  const isRestaurantBranchCreate = !isEditMode && userRole === 'restaurant';

  const [form, setForm] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState('default');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapResults, setMapResults] = useState([]);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [tinCertFile, setTinCertFile] = useState(null);
  const [tinCertPreview, setTinCertPreview] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [licensePreview, setLicensePreview] = useState(null);
  const [existingAssetUrls, setExistingAssetUrls] = useState({
    logo_url: null,
    cover_image_url: null,
    certificate_url: null,
    additional_certificate: null,
  });
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

  const logoRef = useRef(null);
  const coverRef = useRef(null);
  const tinCertRef = useRef(null);
  const licenseRef = useRef(null);
  const mapSearchDebounceRef = useRef(null);
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkerRef = useRef(null);

  const [mapSearch, setMapSearch] = useState('');

  useEffect(() => {
    const hydrateAuthContext = async () => {
      const params = new URLSearchParams(window.location.search);
      const queryRestaurantId = params.get('restaurant_id') || params.get('id') || '';
      setRestaurantId(queryRestaurantId);
      const role = localStorage.getItem('userRole') || '';
      const normalizedRole = String(role).trim().toLowerCase();
      setUserRole(normalizedRole);

      let resolvedParentRestaurantId = String(
        localStorage.getItem('restaurant_id') ||
        localStorage.getItem('selectedRestaurantId') ||
        ''
      ).trim();

      try {
        const rawAdminUser = localStorage.getItem('adminUser') || '';
        if (rawAdminUser) {
          const parsedAdminUser = JSON.parse(rawAdminUser);
          setBranchOwnerContact({
            email: String(parsedAdminUser?.email || '').trim(),
            phone: String(parsedAdminUser?.phone || '').trim(),
          });
        }
      } catch {
        setBranchOwnerContact({ email: '', phone: '' });
      }

      if (normalizedRole === 'restaurant') {
        try {
          const token = localStorage.getItem('token') || '';
          if (token) {
            const meResponse = await fetch('/api/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (meResponse.ok) {
              const mePayload = await meResponse.json();
              const restaurantFromMe =
                mePayload?.restaurant ||
                mePayload?.data?.restaurant ||
                mePayload?.user?.restaurant ||
                mePayload?.data?.user?.restaurant ||
                (Array.isArray(mePayload?.data?.restaurants) ? mePayload.data.restaurants[0] : null);
              const meRestaurantId = String(
                restaurantFromMe?.id ||
                restaurantFromMe?.restaurant_id ||
                ''
              ).trim();
              if (meRestaurantId) {
                resolvedParentRestaurantId = meRestaurantId;
                localStorage.setItem('restaurant_id', meRestaurantId);
                localStorage.setItem('selectedRestaurantId', meRestaurantId);
              }
            }
          }
        } catch {
          // Keep storage-based fallback when /api/me is temporarily unavailable.
        }
      }

      setParentRestaurantId(resolvedParentRestaurantId);
    };

    hydrateAuthContext();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleFileSelect = useCallback((file, setter, previewSetter) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }
    setter(file);
    previewSetter(URL.createObjectURL(file));
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.restaurantName.trim()) newErrors.restaurantName = 'Required';
    if (isRestaurantBranchCreate && !parentRestaurantId) {
      newErrors.parentRestaurantId = 'Main restaurant id is missing for branch creation';
    }
    if (!isRestaurantBranchCreate) {
      if (!form.firstName.trim()) newErrors.firstName = 'Required';
      if (!form.lastName.trim()) newErrors.lastName = 'Required';
      if (!form.phone.trim()) newErrors.phone = 'Required';
      if (!form.email.trim()) newErrors.email = 'Required';
      if (!isEditMode) {
        if (!form.password) newErrors.password = 'Required';
        if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      } else if (form.password || form.confirmPassword) {
        if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    if (!form.latitude || !form.longitude || !mapSearch.trim()) {
      newErrors.location = 'Select location from map so address is picked';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getZoneFromAddress = useCallback((address = {}) =>
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.town ||
    address.city ||
    address.state_district ||
    address.state ||
    '', []);

  const handleMapLookup = async (queryOverride) => {
    const query = (queryOverride ?? mapSearch).trim();
    if (!query) return;

    setMapLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setMapResults(Array.isArray(data) ? data : []);
      if (!Array.isArray(data) || data.length === 0) {
        setErrors((prev) => ({ ...prev, location: 'No location found. Try another search.' }));
      } else {
        setErrors((prev) => ({ ...prev, location: '' }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, location: 'Unable to search map location right now.' }));
      setMapResults([]);
    } finally {
      setMapLoading(false);
    }
  };

  const selectMapLocation = (item) => {
    const lat = Number(item?.lat);
    const lng = Number(item?.lon);
    const zone = getZoneFromAddress(item?.address || {});
    const displayName = typeof item?.display_name === 'string' ? item.display_name : '';

    setForm((prev) => ({
      ...prev,
      latitude: Number.isFinite(lat) ? lat.toFixed(6) : '',
      longitude: Number.isFinite(lng) ? lng.toFixed(6) : '',
      zone,
    }));

    setMapSearch(displayName);
    setMapResults([]);
    setErrors((prev) => ({ ...prev, location: '' }));

    const marker = leafletMarkerRef.current;
    const map = leafletMapRef.current;
    if (marker && map && Number.isFinite(lat) && Number.isFinite(lng)) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 14, { animate: false });
    }
  };

  useEffect(() => {
    const query = mapSearch.trim();

    if (mapSearchDebounceRef.current) {
      clearTimeout(mapSearchDebounceRef.current);
    }

    if (query.length < 3) {
      setMapResults([]);
      return;
    }

    mapSearchDebounceRef.current = setTimeout(() => {
      handleMapLookup(query);
    }, 450);

    return () => {
      if (mapSearchDebounceRef.current) {
        clearTimeout(mapSearchDebounceRef.current);
      }
    };
  }, [mapSearch]);

  const setMapPoint = useCallback(async (lat, lng, options = {}) => {
    const { updateSearch = true } = options;
    const safeLat = Number(lat);
    const safeLng = Number(lng);
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) return;

    setForm((prev) => ({
      ...prev,
      latitude: safeLat.toFixed(6),
      longitude: safeLng.toFixed(6),
    }));
    setErrors((prev) => ({ ...prev, location: '' }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${safeLat}&lon=${safeLng}`
      );
      const reverse = await response.json();
      const zone = getZoneFromAddress(reverse?.address || {});
      const displayName = typeof reverse?.display_name === 'string' ? reverse.display_name : '';

      setForm((prev) => ({
        ...prev,
        zone: zone || prev.zone,
      }));

      if (updateSearch) {
        setMapSearch(displayName || '');
      }
    } catch {
      // Keep coordinates even if reverse geocoding fails.
    }
  }, [getZoneFromAddress]);

  useEffect(() => {
    let disposed = false;

    const loadLeaflet = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      if (!document.getElementById('leaflet-css')) {
        const css = document.createElement('link');
        css.id = 'leaflet-css';
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      if (disposed || leafletMapRef.current || !window.L || !mapContainerRef.current) return;

      const initialLat = Number(form.latitude) || 33.6844;
      const initialLng = Number(form.longitude) || 73.0479;
      const map = window.L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([initialLat, initialLng], 13);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const marker = window.L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        await setMapPoint(position.lat, position.lng, { updateSearch: true });
      });

      map.on('click', async (event) => {
        const { lat, lng } = event.latlng;
        marker.setLatLng([lat, lng]);
        await setMapPoint(lat, lng, { updateSearch: true });
      });

      leafletMapRef.current = map;
      leafletMarkerRef.current = marker;
    };

    loadLeaflet();

    return () => {
      disposed = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
      }
    };
  }, [setMapPoint]);

  useEffect(() => {
    const map = leafletMapRef.current;
    const marker = leafletMarkerRef.current;
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!map || !marker || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], map.getZoom(), { animate: false });
  }, [form.latitude, form.longitude]);

  const pickFirstUrl = useCallback((...values) =>
    values.find((value) => typeof value === 'string' && value.trim().length > 0) || ''
  , []);

  const extractPhone = useCallback((rawPhone = '') => {
    const raw = String(rawPhone || '').trim();
    if (!raw) return { code: '+1', number: '' };
    if (!raw.startsWith('+')) return { code: '+1', number: raw };
    const digits = raw.replace(/[^\d]/g, '');
    if (digits.length <= 3) return { code: `+${digits}`, number: '' };
    const code = `+${digits.slice(0, 3)}`;
    const number = digits.slice(3);
    return { code, number };
  }, []);

  const getRestaurantAndOwnerFromResponse = useCallback((apiResponseData) => {
    const payload =
      apiResponseData?.data && typeof apiResponseData.data === 'object'
        ? apiResponseData.data
        : apiResponseData;
    const restaurant =
      payload?.restaurant ||
      payload?.data?.restaurant ||
      payload;
    const owner =
      payload?.owner ||
      payload?.vendor ||
      restaurant?.owner ||
      restaurant?.vendor ||
      {};

    return { restaurant, owner };
  }, []);

  const extractExistingRestaurantAssets = useCallback((restaurant = {}) => ({
    logo_url: pickFirstUrl(
      restaurant?.logo_url,
      restaurant?.logo,
      restaurant?.logo_full_url
    ) || null,
    cover_image_url: pickFirstUrl(
      restaurant?.cover_image_url,
      restaurant?.cover_image,
      restaurant?.cover_photo
    ) || null,
    certificate_url: pickFirstUrl(
      restaurant?.certificate_url,
      restaurant?.tin_certificate_url
    ) || null,
    additional_certificate: pickFirstUrl(
      restaurant?.license_document_url,
      restaurant?.license_url,
      restaurant?.additional_data?.additional_certificate,
      restaurant?.additional_data?.additional_certificate_url
    ) || null,
  }), [pickFirstUrl]);

  const fetchRestaurantById = useCallback(async (token = '') => {
    const { data } = await axios.get(`/api/restaurants/${restaurantId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return getRestaurantAndOwnerFromResponse(data);
  }, [getRestaurantAndOwnerFromResponse, restaurantId]);

  const toAbsoluteAssetUrl = (value) => {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
    return trimmed;
  };

  const extractUploadedAssetUrls = (uploadData = {}, changedAssetKeys = []) => {
    const source = uploadData?.data && typeof uploadData.data === 'object'
      ? uploadData.data
      : uploadData;
    const assets = source?.assets && typeof source.assets === 'object'
      ? source.assets
      : source;
    const pickFirstRaw = (...values) => {
      const matched = values.find((value) => typeof value === 'string' && value.trim());
      return matched ? matched.trim() : '';
    };

    const uploaded = {
      logo_url: pickFirstRaw(
        assets?.logo_url,
        assets?.logo,
        assets?.logoUrl,
        assets?.logo_full_url,
        assets?.image_url,
        assets?.image?.url,
        assets?.image?.path,
        source?.assets?.logo_url,
        source?.logo_url
      ),
      cover_image_url: pickFirstRaw(
        assets?.cover_image_url,
        assets?.cover_url,
        assets?.cover,
        assets?.coverImageUrl,
        assets?.cover_photo,
        assets?.cover_photo_full_url,
        assets?.cover_image_full_url,
        source?.assets?.cover_image_url,
        source?.cover_image_url
      ),
      certificate_url: pickFirstRaw(
        assets?.certificate_url,
        assets?.tin_certificate_url,
        assets?.certificate,
        assets?.certificate_full_url,
        source?.assets?.certificate_url,
        source?.certificate_url
      ),
      additional_certificate: pickFirstRaw(
        assets?.license_document_url,
        assets?.additional_certificate,
        assets?.additional_certificate_url,
        assets?.license_url,
        assets?.license,
        assets?.license_document_full_url,
        source?.assets?.additional_certificate,
        source?.assets?.additional_certificate_url,
        source?.additional_certificate,
        source?.additional_certificate_url,
        source?.assets?.license_document_url,
        source?.license_document_url
      ),
    };

    const fallbackGenericUrl = pickFirstRaw(
      assets?.full_url,
      assets?.url,
      assets?.path,
      source?.full_url,
      source?.url,
      source?.path
    );
    const changedUniqueKeys = Array.from(new Set(changedAssetKeys.filter(Boolean)));
    if (changedUniqueKeys.length === 1 && fallbackGenericUrl) {
      const uploadedFieldMap = {
        logo: 'logo_url',
        cover_image: 'cover_image_url',
        certificate: 'certificate_url',
        additional_certificate: 'additional_certificate',
      };
      const outputField = uploadedFieldMap[changedUniqueKeys[0]];
      if (outputField && !uploaded[outputField]) {
        uploaded[outputField] = fallbackGenericUrl;
      }
    }

    return uploaded;
  };

  const uploadRestaurantAssets = async (token) => {
    const changedAssetKeys = [];
    if (logoFile) changedAssetKeys.push('logo');
    if (coverFile) changedAssetKeys.push('cover_image');
    if (tinCertFile) changedAssetKeys.push('certificate');
    if (licenseFile) changedAssetKeys.push('additional_certificate');
    const hasAnyAssetFile = changedAssetKeys.length > 0;
    if (!hasAnyAssetFile) {
      return {
        logo_url: null,
        cover_image_url: null,
        certificate_url: null,
        additional_certificate: null,
      };
    }

    const formData = new FormData();
    if (logoFile) formData.append('logo', logoFile);
    if (coverFile) formData.append('cover_image', coverFile);
    if (tinCertFile) formData.append('certificate', tinCertFile);
    if (licenseFile) formData.append('additional_certificate', licenseFile);

    const response = await axios.post('/api/restaurants/uploads/restaurant-assets', formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const uploadedUrls = extractUploadedAssetUrls(response.data, changedAssetKeys);
    if (logoFile && !uploadedUrls.logo_url) throw new Error('Logo upload failed. URL not returned.');
    if (coverFile && !uploadedUrls.cover_image_url) throw new Error('Cover upload failed. URL not returned.');
    if (tinCertFile && !uploadedUrls.certificate_url) throw new Error('Certificate upload failed. URL not returned.');
    if (licenseFile && !uploadedUrls.additional_certificate) throw new Error('Additional certificate upload failed. URL not returned.');

    return uploadedUrls;
  };

  const buildPayload = (uploadedAssetUrls = {}, options = {}) => {
    const { isEdit = false } = options;
    const effectiveParentRestaurantId = String(parentRestaurantId || '').trim();
    const cleanedTags = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const radiusValue = form.radius ? Number(String(form.radius).replace(/[^\d.]/g, '')) : null;
    const latValue = form.latitude ? Number(form.latitude) : null;
    const lngValue = form.longitude ? Number(form.longitude) : null;
    const ownerFullName = `${form.firstName || ''} ${form.lastName || ''}`.trim();
    const ownerPhoneFromForm = `${form.phoneCode}${form.phone}`.trim();
    const ownerPhone = isRestaurantBranchCreate
      ? (branchOwnerContact.phone || ownerPhoneFromForm)
      : ownerPhoneFromForm;
    const ownerEmail = isRestaurantBranchCreate
      ? (branchOwnerContact.email || form.email.trim())
      : form.email.trim();
    const tinExpiryDate = form.tinExpiry ? form.tinExpiry : null;
    const additionalDate = form.additionalDate ? form.additionalDate : null;

    const ownerPayload = {
      email: ownerEmail,
      phone: ownerPhone,
      full_name: ownerFullName,
    };
    if (!isEdit || form.password) {
      ownerPayload.password = form.password;
    }

    const restaurantPayload = {
      name: form.restaurantName.trim(),
      address: mapSearch.trim(),
      zone: form.zone.trim() || mapSearch.trim(),
      lat: Number.isFinite(latValue) ? latValue : null,
      lng: Number.isFinite(lngValue) ? lngValue : null,
      radius_km: Number.isFinite(radiusValue) ? radiusValue : null,
      cuisine: form.cuisine || '',
      logo_url: uploadedAssetUrls.logo_url || null,
      cover_image_url: uploadedAssetUrls.cover_image_url || null,
      delivery_time_min: form.minDeliveryTime ? Number(form.minDeliveryTime) : null,
      delivery_time_max: form.maxDeliveryTime ? Number(form.maxDeliveryTime) : null,
      tags: cleanedTags,
      tin: form.tinNumber.trim(),
      tin_expiry_date: tinExpiryDate,
      certificate_url: uploadedAssetUrls.certificate_url || null,
      additional_data: {
        additional_tin: form.additionalTin.trim(),
        additional_date: additionalDate,
        additional_certificate: uploadedAssetUrls.additional_certificate || null,
      },
      contact_email: ownerEmail,
      phone: ownerPhone,
      tax_type: 'exclusive',
      tax_rate: 5,
      free_delivery_enabled: false,
      description: '',
    };

    // Restaurant role can create branches under their own main restaurant.
    if (!isEdit && userRole === 'restaurant' && effectiveParentRestaurantId) {
      restaurantPayload.parent_restaurant_id = effectiveParentRestaurantId;
      restaurantPayload.parent_id = effectiveParentRestaurantId;
      restaurantPayload.branch_of_restaurant_id = effectiveParentRestaurantId;
      restaurantPayload.is_branch = true;
    }

    if (isRestaurantBranchCreate) {
      const branchPayload = {
        parent_id: effectiveParentRestaurantId,
        name: restaurantPayload.name,
        address: restaurantPayload.address,
        zone: restaurantPayload.zone,
        lat: restaurantPayload.lat,
        lng: restaurantPayload.lng,
        radius_km: restaurantPayload.radius_km,
        cuisine: restaurantPayload.cuisine,
        delivery_time_min: restaurantPayload.delivery_time_min,
        delivery_time_max: restaurantPayload.delivery_time_max,
        tags: restaurantPayload.tags,
        tin: restaurantPayload.tin,
        tin_expiry_date: restaurantPayload.tin_expiry_date,
        logo_url: restaurantPayload.logo_url,
        cover_image_url: restaurantPayload.cover_image_url,
        certificate_url: restaurantPayload.certificate_url,
        additional_data: restaurantPayload.additional_data,
      };

      return {
        ...branchPayload,
      };
    }

    return {
      owner: ownerPayload,
      restaurant: restaurantPayload,
    };
  };

  const buildEditPayload = (basePayload) => {
    const restaurant = basePayload?.restaurant || {};
    const owner = basePayload?.owner || {};

    // Update endpoint commonly expects flat fields; keep aliases to satisfy backend variants.
    return {
      name: restaurant?.name || '',
      address: restaurant?.address || '',
      zone: restaurant?.zone || '',
      lat: restaurant?.lat ?? null,
      lng: restaurant?.lng ?? null,
      latitude: restaurant?.lat ?? null,
      longitude: restaurant?.lng ?? null,
      radius_km: restaurant?.radius_km ?? null,
      service_radius_km: restaurant?.radius_km ?? null,
      cuisine: restaurant?.cuisine || '',
      logo_url: restaurant?.logo_url || null,
      cover_image_url: restaurant?.cover_image_url || null,
      delivery_time_min: restaurant?.delivery_time_min ?? null,
      delivery_time_max: restaurant?.delivery_time_max ?? null,
      tags: Array.isArray(restaurant?.tags) ? restaurant.tags : [],
      tin: restaurant?.tin || '',
      tin_expiry_date: restaurant?.tin_expiry_date || null,
      certificate_url: restaurant?.certificate_url || null,
      additional_data: restaurant?.additional_data || {},
      contact_email: restaurant?.contact_email || owner?.email || '',
      phone: restaurant?.phone || owner?.phone || '',
      owner_name: owner?.full_name || '',
      owner_email: owner?.email || '',
      owner_phone: owner?.phone || '',
      tax_type: restaurant?.tax_type || 'exclusive',
      tax_rate: restaurant?.tax_rate ?? 5,
      free_delivery_enabled: Boolean(restaurant?.free_delivery_enabled),
      description: restaurant?.description || '',
      // Keep nested object as fallback for backends expecting this shape.
      owner,
      restaurant,
    };
  };

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!isEditMode) return;
      setLoadingRestaurant(true);
      try {
        const token = localStorage.getItem('token') || '';
        const { restaurant, owner } = await fetchRestaurantById(token);

        const ownerPhoneRaw = owner?.phone || restaurant?.phone || '';
        const parsedPhone = extractPhone(ownerPhoneRaw);
        const ownerNameRaw =
          owner?.full_name ||
          owner?.name ||
          restaurant?.owner_name ||
          '';
        const ownerNameParts = String(ownerNameRaw).trim().split(/\s+/).filter(Boolean);
        const ownerFirstNameFromFull = ownerNameParts[0] || '';
        const ownerLastNameFromFull = ownerNameParts.slice(1).join(' ');

        const extractedAssets = extractExistingRestaurantAssets(restaurant);
        const logoRawUrl = extractedAssets.logo_url;
        const coverRawUrl = extractedAssets.cover_image_url;
        const certificateRawUrl = extractedAssets.certificate_url;
        const licenseRawUrl = extractedAssets.additional_certificate;
        const logoUrl = toAbsoluteAssetUrl(logoRawUrl);
        const coverImageUrl = toAbsoluteAssetUrl(coverRawUrl);
        const certificateUrl = toAbsoluteAssetUrl(certificateRawUrl);
        const licenseUrl = toAbsoluteAssetUrl(licenseRawUrl);

        setExistingAssetUrls(extractedAssets);
        setLogoPreview(logoUrl || null);
        setCoverPreview(coverImageUrl || null);
        setTinCertPreview(certificateUrl || null);
        setLicensePreview(licenseUrl || null);

        setForm((prev) => ({
          ...prev,
          restaurantName: restaurant?.name || '',
          zone: restaurant?.zone || '',
          cuisine: restaurant?.cuisine || '',
          radius:
            restaurant?.radius_km !== undefined && restaurant?.radius_km !== null
              ? String(restaurant.radius_km)
              : (restaurant?.service_radius_km !== undefined && restaurant?.service_radius_km !== null
                ? String(restaurant.service_radius_km)
                : ''),
          latitude:
            restaurant?.lat !== undefined && restaurant?.lat !== null
              ? String(restaurant.lat)
              : (restaurant?.latitude !== undefined && restaurant?.latitude !== null
                ? String(restaurant.latitude)
                : ''),
          longitude:
            restaurant?.lng !== undefined && restaurant?.lng !== null
              ? String(restaurant.lng)
              : (restaurant?.longitude !== undefined && restaurant?.longitude !== null
                ? String(restaurant.longitude)
                : ''),
          minDeliveryTime: restaurant?.delivery_time_min !== undefined && restaurant?.delivery_time_min !== null ? String(restaurant.delivery_time_min) : '',
          maxDeliveryTime: restaurant?.delivery_time_max !== undefined && restaurant?.delivery_time_max !== null ? String(restaurant.delivery_time_max) : '',
          firstName: owner?.f_name || owner?.first_name || ownerFirstNameFromFull,
          lastName: owner?.l_name || owner?.last_name || ownerLastNameFromFull,
          phone: parsedPhone.number,
          phoneCode: parsedPhone.code,
          tags: Array.isArray(restaurant?.tags) ? restaurant.tags.join(', ') : '',
          tinNumber: restaurant?.tin || '',
          tinExpiry: restaurant?.tin_expiry_date ? String(restaurant.tin_expiry_date).slice(0, 10) : '',
          additionalTin: restaurant?.additional_data?.additional_tin || '',
          additionalDate: restaurant?.additional_data?.additional_date ? String(restaurant.additional_data.additional_date).slice(0, 10) : '',
          email: owner?.email || restaurant?.contact_email || '',
          password: '',
          confirmPassword: '',
        }));
        setMapSearch(restaurant?.address || '');
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to load restaurant'
          : error?.message || 'Failed to load restaurant';
        toast.error(message);
      } finally {
        setLoadingRestaurant(false);
      }
    };

    loadRestaurant();
  }, [extractExistingRestaurantAssets, extractPhone, fetchRestaurantById, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (isRestaurantBranchCreate && !parentRestaurantId) {
      toast.error('Main restaurant id is missing. Please login again and retry.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let latestExistingAssets = existingAssetUrls;
      if (isEditMode) {
        try {
          const { restaurant } = await fetchRestaurantById(token || '');
          latestExistingAssets = extractExistingRestaurantAssets(restaurant);
          setExistingAssetUrls(latestExistingAssets);
        } catch {
          // Keep update flow alive even if pre-refresh GET fails temporarily.
          latestExistingAssets = existingAssetUrls;
        }
      }
      const hasChangedAssetFiles = [logoFile, coverFile, tinCertFile, licenseFile].some(Boolean);
      const uploadedAssetUrls =
        !isEditMode || hasChangedAssetFiles
          ? await uploadRestaurantAssets(token)
          : {
              logo_url: null,
              cover_image_url: null,
              certificate_url: null,
              additional_certificate: null,
            };
      const resolveUpdatedAssetUrl = (uploadedValue, existingValue) =>
        typeof uploadedValue === 'string' && uploadedValue.trim().length > 0
          ? uploadedValue.trim()
          : (existingValue || null);
      const payload = buildPayload(
        {
          logo_url: resolveUpdatedAssetUrl(uploadedAssetUrls.logo_url, latestExistingAssets.logo_url),
          cover_image_url: resolveUpdatedAssetUrl(uploadedAssetUrls.cover_image_url, latestExistingAssets.cover_image_url),
          certificate_url: resolveUpdatedAssetUrl(uploadedAssetUrls.certificate_url, latestExistingAssets.certificate_url),
          additional_certificate: resolveUpdatedAssetUrl(uploadedAssetUrls.additional_certificate, latestExistingAssets.additional_certificate),
        },
        { isEdit: isEditMode }
      );

      if (isEditMode) {
        const editPayload = buildEditPayload(payload);
        await axios.put(`/api/restaurants/${restaurantId}`, editPayload, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } else {
        const createEndpoint = isRestaurantBranchCreate
          ? '/api/restaurants/branches'
          : '/api/restaurants';
        await axios.post(createEndpoint, payload, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }

      toast.success(isEditMode ? 'Restaurant updated successfully.' : 'Restaurant created successfully.');
      router.push('/dashboard/restaurants/list');
    } catch (error) {
      const cleanedMessage = axios.isAxiosError(error)
        ? (error.response?.data?.message || error.message || 'Something went wrong. Please try again.')
        : (error?.message || 'Something went wrong. Please try again.');
      toast.error(cleanedMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setLogoFile(null);
    setLogoPreview(null);
    setCoverFile(null);
    setCoverPreview(null);
    setTinCertFile(null);
    setTinCertPreview(null);
    setLicenseFile(null);
    setLicensePreview(null);
    setErrors({});
  };

  const langTabs = [
    { key: 'default', label: 'Default' },
    { key: 'en', label: 'English (EN)' },
    { key: 'ar', label: 'Arabic (AR)' },
  ];

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {loadingRestaurant && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
            Loading restaurant details...
          </div>
        )}

        {/* ===================== BASIC INFORMATION ===================== */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#1E1E24]">
            Basic Information
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-6">
            Setup your business information here
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* --- LEFT COLUMN --- */}
            <div className="lg:col-span-2 space-y-5">

              {/* Language Tabs */}
              <div className="flex gap-6 border-b border-gray-200">
                {langTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-2 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <InputField
                label="Restaurant Name (Default)"
                name="restaurantName"
                value={form.restaurantName}
                onChange={handleChange}
                placeholder="Ex: ABC Company"
                error={errors.restaurantName}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Cuisine"
                  name="cuisine"
                  value={form.cuisine}
                  onChange={handleChange}
                  options={['Italian', 'Chinese', 'Indian', 'Mexican', 'Thai']}
                  placeholder="Select Cuisine"
                />
                <SelectField
                  label="Radius"
                  name="radius"
                  value={form.radius}
                  onChange={handleChange}
                  options={['1 km', '3 km', '5 km', '10 km', '15 km']}
                  placeholder="Select Radius"
                />
              </div>

              {/* Map Search */}
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" />
                <input
                  value={mapSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMapSearch(value);
                    // If user edits location text again, drop previous coordinates.
                    setForm((prev) => ({ ...prev, latitude: '', longitude: '', zone: '' }));
                    setErrors((prev) => ({ ...prev, location: '' }));
                  }}
                  className="w-full border border-purple-400 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  placeholder="Select location on Map for your exact pickup location"
                />
              </div>
              <p className="text-xs text-gray-400">Type at least 3 characters and select a result</p>
              {errors.location && (
                <p className="text-xs text-red-500">{errors.location}</p>
              )}
              {mapLoading && (
                <p className="text-xs text-gray-500">Searching location...</p>
              )}

              {mapResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-44 overflow-auto">
                  {mapResults.map((item) => (
                    <button
                      key={`${item.place_id}-${item.lat}-${item.lon}`}
                      type="button"
                      onClick={() => selectMapLocation(item)}
                      className="w-full text-left px-3 py-2 text-xs font-normal text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      {item.display_name}
                    </button>
                  ))}
                </div>
              )}

              {/* Interactive Map */}
              <div className="w-full rounded-xl overflow-hidden border border-gray-200">
                <div ref={mapContainerRef} className="h-56 w-full" />
                <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
                  Move map, click location, or drag marker to select exact point.
                </div>
              </div>
            </div>

            {/* --- RIGHT COLUMN (Uploads) --- */}
            <div className="space-y-6">
              <UploadCard
                title="Restaurant LOGO"
                subtitle="Upload your restaurant logo image"
                inputRef={logoRef}
                preview={logoPreview}
                accept="image/*"
                hint="Jpeg, Jpg, Png, Webp Image : Max 2 MB (1:1)"
                onFileSelect={(file) => handleFileSelect(file, setLogoFile, setLogoPreview)}
              />
              <UploadCard
                title="Restaurant Cover"
                subtitle="Upload your restaurant cover photo. Each restaurant must have a unique cover."
                inputRef={coverRef}
                preview={coverPreview}
                accept="image/*"
                hint="Jpeg, Jpg, Png, Webp Image : Max 2 MB (3:1)"
                onFileSelect={(file) => handleFileSelect(file, setCoverFile, setCoverPreview)}
              />
            </div>
          </div>
        </section>

        {/* ===================== GENERAL SETTING ===================== */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#1E1E24]">
            General Setting
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-8">
            Setup your all business general setting
          </p>

          {/* --- Restaurant Information --- */}
          <SubSection
            title="Restaurant Information"
            subtitle="Setup your estimated delivery time from here"
            hasBorder
          >
            <label className="text-sm font-medium text-gray-700 block mb-3">
              Estimated Delivery Time (Min & Max Time)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                name="minDeliveryTime"
                value={form.minDeliveryTime}
                onChange={handleChange}
                placeholder="Ex: 30"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
              />
              <input
                type="number"
                name="maxDeliveryTime"
                value={form.maxDeliveryTime}
                onChange={handleChange}
                placeholder="Ex: 60"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
              />
              <select
                name="deliveryTimeUnit"
                value={form.deliveryTimeUnit}
                onChange={handleChange}
                className="w-full sm:w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none bg-white"
              >
                <option>Minutes</option>
                <option>Hours</option>
              </select>
            </div>
          </SubSection>

          {!isRestaurantBranchCreate && (
            <SubSection
              title="Owner Information"
              subtitle="Setup your personal information from here"
              hasBorder
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InputField
                  label="First Name *"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Ex: John"
                  error={errors.firstName}
                />
                <InputField
                  label="Last Name *"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Ex: Doe"
                  error={errors.lastName}
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Phone *
                  </label>
                  <div className="flex">
                    <PhoneCodeSelect
                      name="phoneCode"
                      value={form.phoneCode}
                      onChange={handleChange}
                      options={PHONE_CODE_OPTIONS}
                      className="w-32"
                    />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="123-456-987"
                      className={`flex-1 min-w-0 border border-gray-200 rounded-r-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none ${
                        errors.phone ? 'border-red-400' : ''
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>
            </SubSection>
          )}

          {/* --- Tags --- */}
          <SubSection
            title="Tags"
            subtitle="Set your business tag for better brand visibility"
            hasBorder
          >
            <InputField
              label="Tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="Enter tags"
            />
          </SubSection>

          {/* --- Business TIN --- */}
          <SubSection
            title="Business TIN"
            subtitle="Setup your business TIN"
            hasBorder
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <InputField
                  label="Taxpayer Identification Number (TIN)"
                  name="tinNumber"
                  value={form.tinNumber}
                  onChange={handleChange}
                  placeholder="Type your TIN Number"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Expire Date
                  </label>
                  <input
                    type="date"
                    name="tinExpiry"
                    value={form.tinExpiry}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-3">
                  TIN Certificate
                </label>
                <UploadZone
                  inputRef={tinCertRef}
                  preview={tinCertPreview}
                  accept="image/*"
                  hint="Jpeg, Jpg, Png, Webp Image : Max 2 MB (1:1)"
                  onFileSelect={(file) => handleFileSelect(file, setTinCertFile, setTinCertPreview)}
                />
                <p className="text-xs text-gray-400 mt-2">Jpeg, Jpg, Png, Webp Image : Max 2 MB (1:1)</p>
              </div>
            </div>
          </SubSection>

          {/* --- Additional Data --- */}
          <SubSection
            title="Additional Data"
            subtitle="Setup your additional legal information"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <InputField
                  label="Enter your TIN Number"
                  name="additionalTin"
                  value={form.additionalTin}
                  onChange={handleChange}
                  placeholder="TIN Number"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="additionalDate"
                    value={form.additionalDate}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-3">
                  License Document
                </label>
                <UploadZone
                  inputRef={licenseRef}
                  preview={licensePreview}
                  accept="image/*"
                  hint="Jpeg, Jpg, Png, Webp Image : Max 2 MB"
                  onFileSelect={(file) => handleFileSelect(file, setLicenseFile, setLicensePreview)}
                />
                <p className="text-xs text-gray-400 mt-2">Jpeg, Jpg, Png, Webp Image : Max 2 MB</p>
              </div>
            </div>
          </SubSection>
        </section>

        {!isRestaurantBranchCreate && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#1E1E24]">
              Account Information
            </h2>
            <p className="text-xs text-gray-400 mt-1 mb-6">
              Account information
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField
                label="Email *"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="restaurant@email.com"
                error={errors.email}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm pr-10 focus:border-purple-400 focus:outline-none ${
                      errors.password ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm pr-10 focus:border-purple-400 focus:outline-none ${
                      errors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ===================== ACTION BUTTONS ===================== */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || loadingRestaurant}
            className="px-8 py-2.5 text-sm font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Restaurant' : 'Save Restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   REUSABLE SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */

function SubSection({ title, subtitle, hasBorder, children }) {
  return (
    <div className={`pb-6 mb-6 ${hasBorder ? 'border-b border-gray-200' : ''}`}>
      <h3 className="text-sm font-bold text-[#1E1E24]">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function InputField({ label, name, value, onChange, placeholder, type = 'text', error }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function UploadZone({ inputRef, preview, accept, hint, onFileSelect }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg h-28 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors bg-white"
      >
        {preview ? (
          <img src={preview} alt="preview" className="h-full w-full object-cover rounded-lg" />
        ) : (
          <>
            <Upload size={18} className="text-purple-500 mb-1.5" />
            <p className="text-xs text-gray-500 text-center px-2">
              <span className="text-purple-600 font-medium">Click to Upload</span>{' '}
              or Drag & Drop
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = '';
        }}
      />
    </>
  );
}

function UploadCard({ title, subtitle, inputRef, preview, accept, hint, onFileSelect }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-bold text-[#1E1E24] mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
      <UploadZone
        inputRef={inputRef}
        preview={preview}
        accept={accept}
        hint={hint}
        onFileSelect={onFileSelect}
      />
      <p className="text-xs text-gray-400 mt-2">{hint}</p>
    </div>
  );
}
