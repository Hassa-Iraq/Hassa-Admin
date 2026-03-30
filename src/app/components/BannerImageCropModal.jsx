'use client';

import ImageCropModal from '@/app/components/ImageCropModal';

/** Default banner crop ratio: width : height = 2.4 : 1. Override with `aspect` prop when needed. */
const DEFAULT_BANNER_ASPECT = 2.4;

export default function BannerImageCropModal(props) {
  return (
    <ImageCropModal
      aspect={DEFAULT_BANNER_ASPECT}
      title="Crop banner image"
      outputBasename="banner"
      titleId="banner-crop-title"
      {...props}
    />
  );
}
