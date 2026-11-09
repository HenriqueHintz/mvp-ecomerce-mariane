"use client";

import React from "react";
import ProductsError from "@/app/produtos/error";

export default function CategoryError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ProductsError {...props} />;
}
