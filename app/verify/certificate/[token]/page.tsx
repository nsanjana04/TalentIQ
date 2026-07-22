import { VerifyCertificateClient } from "./verify-client";

type PageProps = { params: Promise<{ token: string }> };

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { token } = await params;
  return <VerifyCertificateClient token={token} />;
}
