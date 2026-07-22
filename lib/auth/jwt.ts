import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { RoleSlug } from "@/constants/role-slugs";
import type { Permission } from "@/lib/rbac/permissions";

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: RoleSlug;
  permissions: Permission[];
  permissionVersion?: number;
  userPermissionVersion?: number;
  type: "access";
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  jti: string;
  type: "refresh";
}

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function parseDuration(duration: string): string {
  return duration;
}

export async function signAccessToken(payload: {
  userId: string;
  email: string;
  role: RoleSlug;
  permissions: Permission[];
  permissionVersion?: number;
  userPermissionVersion?: number;
}): Promise<string> {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";

  return new SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions,
    permissionVersion: payload.permissionVersion ?? 0,
    userPermissionVersion: payload.userPermissionVersion ?? 0,
    type: "access",
  } satisfies Omit<AccessTokenPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(parseDuration(expiresIn))
    .sign(getAccessSecret());
}

export async function signRefreshToken(payload: {
  userId: string;
  tokenId: string;
}): Promise<string> {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

  return new SignJWT({
    sub: payload.userId,
    jti: payload.tokenId,
    type: "refresh",
  } satisfies Omit<RefreshTokenPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(parseDuration(expiresIn))
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret());

  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }

  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());

  if (payload.type !== "refresh") {
    throw new Error("Invalid token type");
  }

  return payload as RefreshTokenPayload;
}
