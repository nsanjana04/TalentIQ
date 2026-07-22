export function PythonLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#EFF6FF" />
      <path
        d="M20 10c-4.5 0-7 2-7 5.5v2h7v1H10v3.5c0 3.5 2.5 5.5 7 5.5h2v-3.5c0-3.5 2-5.5 5.5-5.5h3.5v-7H20zm-3.5 3a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z"
        fill="#2563EB"
      />
      <path
        d="M20 30c4.5 0 7-2 7-5.5v-2h-7v-1h10v-3.5c0-3.5-2.5-5.5-7-5.5h-2v3.5c0 3.5-2 5.5-5.5 5.5H10v7h10zm3.5-3a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"
        fill="#FACC15"
      />
    </svg>
  );
}

export function AwsLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#FFF7ED" />
      <path
        d="M10 24c4 3 8.5 4.5 14 4.5 2.8 0 5.5-.5 8-1.5-.7 1-1.6 1.8-2.7 2.4-1.2.7-2.6 1.1-4.1 1.1-3.5 0-6.6-1.5-9.2-4.5z"
        fill="#F97316"
      />
      <text x="11" y="18" fill="#F97316" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">
        aws
      </text>
    </svg>
  );
}

const KUBERNETES_SPOKES: { x2: number; y2: number }[] = [
  { x2: 30, y2: 20 },
  { x2: 25, y2: 28.66 },
  { x2: 15, y2: 28.66 },
  { x2: 10, y2: 20 },
  { x2: 15, y2: 11.34 },
  { x2: 25, y2: 11.34 },
];

export function KubernetesLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#EFF6FF" />
      <circle cx="20" cy="20" r="10" stroke="#2563EB" strokeWidth="1.5" fill="none" />
      <circle cx="20" cy="20" r="3" fill="#2563EB" />
      {KUBERNETES_SPOKES.map((spoke, i) => (
        <line
          key={i}
          x1="20"
          y1="20"
          x2={spoke.x2}
          y2={spoke.y2}
          stroke="#2563EB"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

export function DevOpsLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#EFF6FF" />
      <path d="M10 26l10-12 10 12H10z" fill="#2563EB" opacity="0.2" />
      <path d="M14 24h12l-6-8-6 8z" stroke="#2563EB" strokeWidth="1.5" fill="none" />
      <path d="M20 12v4M16 16h8" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function JavaLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#FFF7ED" />
      <text x="10" y="25" fill="#EA580C" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">
        Java
      </text>
    </svg>
  );
}

export function WebLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#EFF6FF" />
      <rect x="10" y="12" width="20" height="16" rx="2" stroke="#2563EB" strokeWidth="1.5" fill="none" />
      <path d="M10 16h20" stroke="#2563EB" strokeWidth="1.5" />
      <circle cx="13" cy="14" r="1" fill="#2563EB" />
      <circle cx="16" cy="14" r="1" fill="#2563EB" />
    </svg>
  );
}

export function SqlLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#F0FDF4" />
      <ellipse cx="20" cy="14" rx="8" ry="3" stroke="#16A34A" strokeWidth="1.5" fill="none" />
      <path d="M12 14v10c0 1.7 3.6 3 8 3s8-1.3 8-3V14" stroke="#16A34A" strokeWidth="1.5" fill="none" />
      <path d="M12 19c0 1.7 3.6 3 8 3s8-1.3 8-3" stroke="#16A34A" strokeWidth="1.5" fill="none" />
      <text x="14" y="31" fill="#16A34A" fontSize="7" fontWeight="700" fontFamily="Inter,sans-serif">
        SQL
      </text>
    </svg>
  );
}

export function ExcelLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#F0FDF4" />
      <rect x="11" y="11" width="18" height="18" rx="2" fill="#16A34A" />
      <text x="14" y="24" fill="white" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">
        XL
      </text>
    </svg>
  );
}

export function GitLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#FEF2F2" />
      <circle cx="20" cy="20" r="3" fill="#DC2626" />
      <path d="M20 17V11M20 29v-6M17 20h-6M29 20h-6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="11" r="2" fill="#DC2626" />
      <circle cx="20" cy="29" r="2" fill="#DC2626" />
      <circle cx="11" cy="20" r="2" fill="#DC2626" />
      <circle cx="29" cy="20" r="2" fill="#DC2626" />
    </svg>
  );
}

export function SecurityLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#FEF2F2" />
      <path
        d="M20 10l10 4v8c0 6-4.5 10.5-10 12-5.5-1.5-10-6-10-12v-8l10-4z"
        stroke="#DC2626"
        strokeWidth="1.5"
        fill="#FEE2E2"
      />
      <path d="M16 20l3 3 6-6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CppLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#EFF6FF" />
      <text x="9" y="25" fill="#2563EB" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">
        C++
      </text>
    </svg>
  );
}

export function JavascriptLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#FEFCE8" />
      <text x="12" y="25" fill="#CA8A04" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">
        JS
      </text>
    </svg>
  );
}

export function GeneralLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#F3F4F6" />
      <path d="M14 14h12v12H14z" stroke="#6B7280" strokeWidth="1.5" fill="none" />
      <path d="M17 20h6M20 17v6" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export type TechLogoKey =
  | "python"
  | "aws"
  | "kubernetes"
  | "devops"
  | "java"
  | "web"
  | "sql"
  | "excel"
  | "git"
  | "security"
  | "cpp"
  | "javascript"
  | "general";

export function TechLogo({ type, size = 40 }: { type: TechLogoKey; size?: number }) {
  switch (type) {
    case "python":
      return <PythonLogo size={size} />;
    case "aws":
      return <AwsLogo size={size} />;
    case "kubernetes":
      return <KubernetesLogo size={size} />;
    case "devops":
      return <DevOpsLogo size={size} />;
    case "java":
      return <JavaLogo size={size} />;
    case "web":
      return <WebLogo size={size} />;
    case "sql":
      return <SqlLogo size={size} />;
    case "excel":
      return <ExcelLogo size={size} />;
    case "git":
      return <GitLogo size={size} />;
    case "security":
      return <SecurityLogo size={size} />;
    case "cpp":
      return <CppLogo size={size} />;
    case "javascript":
      return <JavascriptLogo size={size} />;
    case "general":
      return <GeneralLogo size={size} />;
  }
}
