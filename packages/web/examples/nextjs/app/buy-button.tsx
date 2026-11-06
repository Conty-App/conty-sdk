"use client";

import { conty } from "@conty/web";

interface BuyButtonProps {
  productId: string;
}

export function BuyButton({ productId }: BuyButtonProps) {
  return (
    <button type="button" onClick={() => conty.track("begin_checkout", { product: productId })}>
      Comprar
    </button>
  );
}
