import { NextResponse } from "next/server";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]> | string[];
  [key: string]: unknown;
}

export function createProblemDetailsResponse(
  status: number,
  title: string,
  detail: string,
  options?: {
    type?: string;
    instance?: string;
    errors?: Record<string, string[]> | string[];
    extra?: Record<string, unknown>;
  }
) {
  const problem: ProblemDetails = {
    type: options?.type || `https://marianecosmeticos.com.br/erros/${status}`,
    title,
    status,
    detail,
    ...(options?.instance ? { instance: options.instance } : {}),
    ...(options?.errors ? { errors: options.errors } : {}),
    ...(options?.extra || {}),
  };

  return NextResponse.json(problem, {
    status,
    headers: {
      "Content-Type": "application/problem+json",
    },
  });
}
