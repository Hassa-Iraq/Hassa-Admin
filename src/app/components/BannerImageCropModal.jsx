'use client';

import ImageCropModal from '@/app/components/ImageCropModal';

/** Default wide promo crop ratio: width : height = 2.4 : 1. */
const DEFAULT_BANNER_ASPECT = 2.4;

export default function BannerImageCropModal(props) {
  return (
    <ImageCropModal
      aspect={DEFAULT_BANNER_ASPECT}
      title="Crop advertisement image"
      outputBasename="advertisement"
      titleId="advertisement-crop-title"
      {...props}
    />
  );
}
