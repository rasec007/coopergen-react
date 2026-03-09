'use client';

import dynamic from 'next/dynamic';

const PaystubBatchForm = dynamic(() => import('@/components/PaystubBatchForm'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#83004c]"></div>
    </div>
  ),
});

export default function NewPaystubPage() {
  return <PaystubBatchForm />;
}
