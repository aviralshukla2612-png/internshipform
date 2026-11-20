import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/rbac.decorator';
import { UserRoleType } from '@recruitment/shared';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions specified on endpoint, allow authenticated user
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: Unauthenticated user');
    }

    // Super Admin bypasses all role/permission checks
    if (user.roles?.includes(UserRoleType.SUPER_ADMIN)) {
      return true;
    }

    // Role check
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = user.roles?.some((role: UserRoleType) => requiredRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException('Access denied: Insufficient role privileges');
      }
    }

    // Permission check
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every((perm) =>
        user.permissions?.includes(perm),
      );
      if (!hasPermission) {
        throw new ForbiddenException(`Access denied: Missing required permission(s)`);
      }
    }

    return true;
  }
}
