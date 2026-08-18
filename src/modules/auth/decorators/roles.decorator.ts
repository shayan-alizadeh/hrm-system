import { SetMetadata } from '@nestjs/common';
import { roleType } from 'generated/prisma/enums.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: roleType[]) => SetMetadata(ROLES_KEY, roles);
