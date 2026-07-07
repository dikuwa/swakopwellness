"use client";

import { useState, type ReactNode } from "react";
import { ServiceForm } from "../../service-form";
import { GalleryManager } from "./gallery-manager";

interface GalleryImage {
  id: string;
  publicUrl: string | null;
  altText: string | null;
}

interface MediaAsset {
  id: string;
  publicUrl: string | null;
  altText: string | null;
  mimeType: string;
  byteSize: number;
}

interface Props {
  categories: { id: string; name: string }[];
  action: (data: FormData) => Promise<{ ok: boolean; error?: string; serviceId?: string }>;
  serviceId: string;
  initialData: {
    name: string;
    slug: string;
    categoryId: string | null;
    shortDescription: string;
    fullDescription: string;
    priceCents: number;
    durationMinutes: number | null;
    benefits: string[];
    whatToExpect: string | null;
    preparation: string | null;
    safetyInformation: string | null;
    publicVisible: boolean;
    bookingEnabled: boolean;
    featured: boolean;
    sortOrder: number;
    featuredImageId: string | null;
  };
  galleryImages: GalleryImage[];
  allMedia: MediaAsset[];
  faqsSlot: ReactNode;
}

export function EditServiceClient({
  categories,
  action,
  serviceId,
  initialData,
  galleryImages,
  allMedia,
  faqsSlot,
}: Props) {
  // Track the current featured image URL so ServiceForm and GalleryManager stay in sync
  const [featuredUrl, setFeaturedUrl] = useState<string | null>(
    galleryImages[0]?.publicUrl ?? null,
  );

  return (
    <>
      <ServiceForm
        categories={categories}
        action={action}
        serviceId={serviceId}
        galleryImages={
          featuredUrl
            ? galleryImages.length > 0
              ? [{ ...galleryImages[0], publicUrl: featuredUrl }]
              : [{ id: "live", publicUrl: featuredUrl, altText: null }]
            : galleryImages
        }
        initialData={initialData}
        onFeaturedImageChange={(url) => setFeaturedUrl(url)}
      >
        {faqsSlot}
      </ServiceForm>

      <div className="mt-0">
        <GalleryManager
          serviceId={serviceId}
          galleryImages={allMedia.filter((m) => galleryImages.some((g) => g.id === m.id))}
          allMedia={allMedia}
          onFeaturedImageChange={(url) => setFeaturedUrl(url)}
        />
      </div>
    </>
  );
}
