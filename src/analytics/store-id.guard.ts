import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class StoreIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const storeId = request.headers['x-store-id'];

    if (!storeId) {
      throw new UnauthorizedException('x-store-id header is required');
    }

    request.storeId = storeId;
    return true;
  }
}
