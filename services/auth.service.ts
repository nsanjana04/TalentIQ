import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSsoSettings } from "@/lib/auth/sso/config";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { getRefreshExpiryDate } from "@/lib/auth/remember-me";
import { generateSecureToken, hashToken, getTokenExpiry } from "@/lib/auth/tokens";
import type { RoleSlug } from "@/constants/role-slugs";
import type { AuthUser, LoginCredentials, UserSession } from "@/types/auth";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { userRepository } from "@/repositories/user.repository";
import { sessionRepository } from "@/repositories/session.repository";
import { auditService } from "./audit.service";
import { rbacService } from "./rbac.service";
import { emailService } from "./email.service";
import { permissionVersionService } from "@/lib/rbac/permission-version.service";

type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId: string;
  emailVerifiedAt?: Date | null;
  role: { slug: string };
};

async function toAuthUser(user: SessionUser): Promise<AuthUser> {
  const roleSlug = user.role.slug as RoleSlug;
  const [effective, scope, versions] = await Promise.all([
    rbacService.resolveUserPermissions(user.id, user.roleId, roleSlug),
    resolveDashboardScope(user.id, roleSlug),
    permissionVersionService.getVersions(user.id),
  ]);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: roleSlug,
    roleId: user.roleId,
    permissions: effective.permissions,
    deniedPermissions: effective.denied,
    permissionVersion: versions.global,
    userPermissionVersion: versions.user,
    scope: { type: scope.type, label: scope.label },
    isActive: user.isActive,
    emailVerified: !!user.emailVerifiedAt,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  };
}

async function signAccessForUser(user: SessionUser, authUser: AuthUser): Promise<string> {
  return signAccessToken({
    userId: user.id,
    email: user.email,
    role: authUser.role,
    permissions: authUser.permissions,
    permissionVersion: authUser.permissionVersion,
    userPermissionVersion: authUser.userPermissionVersion,
  });
}

export const authService = {
  async establishSession(
    user: SessionUser,
    context?: {
      rememberMe?: boolean;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const rememberMe = context?.rememberMe ?? false;
    const authUser = await toAuthUser(user);
    const refreshTokenValue = randomBytes(48).toString("hex");
    const expiresAt = getRefreshExpiryDate(rememberMe);

    await sessionRepository.create({
      token: refreshTokenValue,
      userId: user.id,
      expiresAt,
      rememberMe,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
    });

    const [accessToken] = await Promise.all([
      signAccessForUser(user, authUser),
      signRefreshToken({ userId: user.id, tokenId: refreshTokenValue }),
    ]);

    await userRepository.updateLastLogin(user.id);

    await auditService.log({
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      actorId: user.id,
      metadata: { rememberMe, ...context?.metadata },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { user: authUser, accessToken, refreshToken: refreshTokenValue, rememberMe };
  },

  async login(
    credentials: LoginCredentials,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const ssoSettings = await getSsoSettings();
    if (ssoSettings.enabled) {
      throw new AppError(
        "UNAUTHORIZED",
        "Please sign in with your organization Microsoft account."
      );
    }

    const user = await userRepository.findByEmail(credentials.email);

    if (!user || !user.isActive) {
      await auditService.log({
        action: "LOGIN_FAILED",
        entityType: "User",
        metadata: { email: credentials.email },
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
      throw new AppError("UNAUTHORIZED", "Invalid email or password");
    }

    if (!user.passwordHash) {
      throw new AppError(
        "UNAUTHORIZED",
        "This account uses single sign-on. Please sign in with your organization."
      );
    }

    const valid = await verifyPassword(credentials.password, user.passwordHash);
    if (!valid) {
      await auditService.log({
        action: "LOGIN_FAILED",
        entityType: "User",
        entityId: user.id,
        actorId: user.id,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
      throw new AppError("UNAUTHORIZED", "Invalid email or password");
    }

    return this.establishSession(user, {
      rememberMe: credentials.rememberMe ?? false,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: { method: "password" },
    });
  },

  async refresh(
    refreshToken: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const session = await sessionRepository.findByToken(refreshToken);

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("UNAUTHORIZED", "Invalid or expired refresh token");
    }

    if (!session.user.isActive) {
      throw new AppError("UNAUTHORIZED", "Account is inactive");
    }

    await sessionRepository.revoke(refreshToken);

    const authUser = await toAuthUser(session.user);
    const newRefreshTokenValue = randomBytes(48).toString("hex");
    const expiresAt = getRefreshExpiryDate(session.rememberMe);

    await sessionRepository.create({
      token: newRefreshTokenValue,
      userId: session.userId,
      expiresAt,
      rememberMe: session.rememberMe,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
    });

    const accessToken = await signAccessForUser(session.user, authUser);

    await auditService.log({
      action: "REFRESH_TOKEN",
      entityType: "User",
      entityId: session.userId,
      actorId: session.userId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return {
      user: authUser,
      accessToken,
      refreshToken: newRefreshTokenValue,
      rememberMe: session.rememberMe,
    };
  },

  /** Reload permissions from DB and issue a fresh access token (keeps refresh token). */
  async refreshPermissions(
    userId: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const user = await userRepository.findByIdWithRole(userId);
    if (!user || !user.isActive) {
      throw new AppError("UNAUTHORIZED", "User not found or inactive");
    }

    const authUser = await toAuthUser(user);
    const accessToken = await signAccessForUser(user, authUser);

    await auditService.log({
      action: "REFRESH_TOKEN",
      entityType: "User",
      entityId: userId,
      actorId: userId,
      metadata: { type: "permissions" },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { user: authUser, accessToken };
  },

  async logout(
    refreshToken: string | undefined,
    actorId?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    if (refreshToken) {
      try {
        await sessionRepository.revoke(refreshToken);
      } catch {
        // Token may already be revoked
      }
    }

    if (actorId) {
      await auditService.log({
        action: "LOGOUT",
        entityType: "User",
        entityId: actorId,
        actorId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
    }
  },

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await userRepository.findByIdWithRole(userId);
    if (!user || !user.isActive) {
      throw new AppError("UNAUTHORIZED", "User not found or inactive");
    }
    return toAuthUser(user);
  },

  async forgotPassword(
    email: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const user = await userRepository.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return { message: "If an account exists, a reset link has been sent." };
    }

    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = getTokenExpiry(1);

    await userRepository.setPasswordResetToken(user.id, tokenHash, expiresAt);
    await emailService.sendPasswordReset(user.email, token);

    await auditService.log({
      action: "CREATE",
      entityType: "PasswordReset",
      entityId: user.id,
      actorId: user.id,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { message: "If an account exists, a reset link has been sent." };
  },

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const tokenHash = hashToken(token);
    const user = await userRepository.findByPasswordResetToken(email, tokenHash);

    if (!user) {
      throw new AppError("BAD_REQUEST", "Invalid or expired reset token");
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(user.id, passwordHash);
    await userRepository.clearPasswordResetToken(user.id);
    await sessionRepository.revokeAllForUser(user.id);
    await emailService.sendPasswordChanged(user.email);

    await auditService.log({
      action: "PASSWORD_CHANGE",
      entityType: "User",
      entityId: user.id,
      actorId: user.id,
      metadata: { method: "reset" },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { message: "Password reset successfully. Please sign in." };
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const user = await userRepository.findByIdWithRole(userId);
    if (!user) throw new AppError("NOT_FOUND", "User not found");

    if (!user.passwordHash) {
      throw new AppError(
        "BAD_REQUEST",
        "Password change is not available for single sign-on accounts"
      );
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError("UNAUTHORIZED", "Current password is incorrect");
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(user.id, passwordHash);
    await emailService.sendPasswordChanged(user.email);

    await auditService.log({
      action: "PASSWORD_CHANGE",
      entityType: "User",
      entityId: user.id,
      actorId: user.id,
      metadata: { method: "change" },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { message: "Password changed successfully" };
  },

  async sendVerificationEmail(
    email: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      return { message: "If an account exists, a verification email has been sent." };
    }

    if (user.emailVerifiedAt) {
      return { message: "Email is already verified" };
    }

    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = getTokenExpiry(24);

    await userRepository.setEmailVerificationToken(user.id, tokenHash, expiresAt);
    await emailService.sendEmailVerification(user.email, token);

    await auditService.log({
      action: "CREATE",
      entityType: "EmailVerification",
      entityId: user.id,
      actorId: user.id,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { message: "If an account exists, a verification email has been sent." };
  },

  async verifyEmail(
    email: string,
    token: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const tokenHash = hashToken(token);
    const user = await userRepository.findByEmailVerificationToken(email, tokenHash);

    if (!user) {
      throw new AppError("BAD_REQUEST", "Invalid or expired verification token");
    }

    await userRepository.verifyEmail(user.id);

    await auditService.log({
      action: "UPDATE",
      entityType: "User",
      entityId: user.id,
      actorId: user.id,
      metadata: { action: "email_verified" },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return { message: "Email verified successfully" };
  },

  async getSessions(userId: string, currentToken?: string): Promise<UserSession[]> {
    const sessions = await sessionRepository.findActiveByUser(userId);
    return sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      rememberMe: s.rememberMe,
      isCurrent: currentToken ? s.token === currentToken : false,
    }));
  },

  async revokeSession(userId: string, sessionId: string) {
    const result = await sessionRepository.revokeById(sessionId, userId);
    if (result.count === 0) {
      throw new AppError("NOT_FOUND", "Session not found");
    }
    return { message: "Session revoked" };
  },

  async revokeAllSessions(userId: string, currentToken?: string) {
    if (currentToken) {
      await sessionRepository.revokeAllExcept(userId, currentToken);
    } else {
      await sessionRepository.revokeAllForUser(userId);
    }
    return { message: "All other sessions revoked" };
  },

  async registerUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("CONFLICT", "Email already registered");
    }

    const passwordHash = await hashPassword(data.password);
    const employeeRole = await prisma.role.findUnique({
      where: { slug: "EMPLOYEE" },
    });
    if (!employeeRole) {
      throw new AppError("INTERNAL_ERROR", "Default employee role not configured");
    }

    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      roleId: employeeRole.id,
    });

    await this.sendVerificationEmail(data.email);

    return user;
  },
};
