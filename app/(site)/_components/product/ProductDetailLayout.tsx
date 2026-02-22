import { type ReactNode, type RefObject } from "react";
import PageContainer from "@/components/shared/PageContainer";

interface ProductDetailLayoutProps {
  breadcrumb: ReactNode;
  gallery: ReactNode;
  header: ReactNode;
  details?: ReactNode;
  purchaseControls: ReactNode;
  purchaseControlsRef?: RefObject<HTMLDivElement | null>;
  brewGuide?: ReactNode;
  story?: ReactNode;
  addOns?: ReactNode;
  relatedProducts?: ReactNode;
  floatingButton?: ReactNode;
  hasDetails?: boolean;
}

export function ProductDetailLayout({
  breadcrumb,
  gallery,
  header,
  details,
  purchaseControls,
  purchaseControlsRef,
  brewGuide,
  story,
  addOns,
  relatedProducts,
  floatingButton,
  hasDetails = false,
}: ProductDetailLayoutProps) {
  return (
    <PageContainer>
      {breadcrumb}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-x-10 md:gap-y-5 lg:gap-x-14 lg:gap-y-8">
        <div className="w-full min-w-0 md:sticky md:top-6 md:self-start animate-fade-in-up">
          {gallery}
        </div>

        <div className="w-full min-w-0 flex flex-col gap-4">
          {header}

          <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-8 lg:mt-4">
            {details && (
              <div className="lg:flex-[2] lg:min-w-0">{details}</div>
            )}

            <div
              ref={purchaseControlsRef}
              className={`${hasDetails ? "lg:flex-[3]" : ""} lg:min-w-0`}
            >
              {purchaseControls}
            </div>
          </div>

          {story}

          {brewGuide}

          {addOns}
        </div>
      </div>

      {relatedProducts}

      {floatingButton}
    </PageContainer>
  );
}
