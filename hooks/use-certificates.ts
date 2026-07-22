"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CertificateAnalytics,
  CertificateMeta,
  CertificateOverview,
  CertificateRecord,
  CertificateTemplateItem,
  VerificationResult,
} from "@/types/certificates";
import type { CreateTemplateInput, IssueCertificateInput } from "@/lib/validations/certificates";

export const CERTIFICATES_KEY = ["certificates"] as const;

export function useCertificateOverview() {
  return useQuery({
    queryKey: [...CERTIFICATES_KEY, "overview"],
    queryFn: () => apiClient.get<CertificateOverview>("/api/certificates/overview"),
    staleTime: 60_000,
  });
}

export function useCertificateMeta() {
  return useQuery({
    queryKey: [...CERTIFICATES_KEY, "meta"],
    queryFn: () => apiClient.get<CertificateMeta>("/api/certificates/meta"),
    staleTime: 5 * 60_000,
  });
}

export function useCertificateTemplates() {
  return useQuery({
    queryKey: [...CERTIFICATES_KEY, "templates"],
    queryFn: () => apiClient.get<CertificateTemplateItem[]>("/api/certificates/templates"),
    staleTime: 30_000,
  });
}

export function useCertificateList(search?: string, status?: string) {
  return useQuery({
    queryKey: [...CERTIFICATES_KEY, "list", search, status],
    queryFn: () =>
      apiClient.get<CertificateRecord[]>("/api/certificates", {
        params: {
          ...(search && { search }),
          ...(status && status !== "all" && { status }),
        },
      }),
    staleTime: 30_000,
  });
}

export function useMyCertificates() {
  return useQuery({
    queryKey: [...CERTIFICATES_KEY, "my"],
    queryFn: () => apiClient.get<CertificateRecord[]>("/api/certificates/my"),
    staleTime: 30_000,
  });
}

export function useCertificateAnalytics() {
  return useQuery({
    queryKey: [...CERTIFICATES_KEY, "analytics"],
    queryFn: () => apiClient.get<CertificateAnalytics>("/api/certificates/analytics"),
    staleTime: 60_000,
  });
}

export function useVerifyCertificate(token: string | null) {
  return useQuery({
    queryKey: [...CERTIFICATES_KEY, "verify", token],
    queryFn: () => apiClient.get<VerificationResult>(`/api/certificates/verify/${token}`),
    enabled: !!token,
    retry: false,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: CERTIFICATES_KEY });
}

export function useCertificateMutations() {
  const invalidate = useInvalidate();

  const createTemplate = useMutation({
    mutationFn: (data: CreateTemplateInput) =>
      apiClient.post("/api/certificates/templates", data),
    onSuccess: invalidate,
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/certificates/templates/${id}`),
    onSuccess: invalidate,
  });

  const issueCertificate = useMutation({
    mutationFn: (data: IssueCertificateInput) => apiClient.post("/api/certificates", data),
    onSuccess: invalidate,
  });

  const renewCertificate = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/certificates/${id}/renew`, {}),
    onSuccess: invalidate,
  });

  const expireCertificate = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/certificates/${id}/expire`, {}),
    onSuccess: invalidate,
  });

  const revokeCertificate = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/api/certificates/${id}/revoke`, { reason }),
    onSuccess: invalidate,
  });

  return {
    createTemplate,
    deleteTemplate,
    issueCertificate,
    renewCertificate,
    expireCertificate,
    revokeCertificate,
  };
}
