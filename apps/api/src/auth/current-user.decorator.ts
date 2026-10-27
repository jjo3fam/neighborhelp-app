import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Returns the authenticated user's id (set by JwtStrategy.validate). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => ctx.switchToHttp().getRequest().user.id,
);
