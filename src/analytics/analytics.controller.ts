import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { StoreIdGuard } from './store-id.guard';


@Controller('api/v1/analytics')
@UseGuards(StoreIdGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /*Caching start :

  We used basic cache-aside patern to make <500ms possible,
  For our eviction strategy, used TTL, keeping it simple, didn't cache our recent-activity to still give the user that live feel
  each enddpoint decison making is explained below :

  we won't cache, as SQL query is pretty simple (SELECT * FROM events WHERE store_id = $1 ORDER BY timestamp DESC LIMIT 20;) (O(log(n)))
  plus a single query compared to the much bigger overview query*/

  /*Auth:
  we check store_id from the header instead of query param and have a custom guard that rejects (401 unauthorized) any 
  request that doesn't have it, in real life though, we would have to extract store ID from a valid JWT to ensure that people
  can't access other people's dashboard (using Passport)
  
  */



  /*not cached, as mentioned above */
  @Get('recent-activity')
  async getRecentActivity(@Req() req: any) {
    return this.analyticsService.getRecentActivity(req.storeId);
  }



  /* for this endpoint, we added 60s caching TTL, though real-time data is a requirement, here, we get 60s fresh data against
  in exhange for much faster loading times (to get <500ms loading), to still give the user that real time feel, we won't cache the recent-events
  endpoint as the SQL query is much simpler/faster allowing <500ms loading*/
  @Get('overview')
  async getOverview(
    @Req() req: any,
    @Query('period') period?: string,
  ) {
    const validPeriods = ['today', 'week', 'month'];
    if (period && !validPeriods.includes(period)) {
      throw new BadRequestException(
        'period must be one of: today, week, month',
      );
    }
    return this.analyticsService.getOverview(req.storeId, period || 'month');
  }


  /*For this endpoint, we will cache it and add much longer TTL (300s) as top products are likley to not be updated every second
  hence we will reduce our DB queries (1 per 300s) while gaining memory fast responses (cache), no real drawback tbh*/

  @Get('top-products')
  async getTopProducts(@Req() req: any) {
    return this.analyticsService.getTopProducts(req.storeId);
  }
}


/* 
Testing Results : 

Let's first check if our cache is effective at speeding up stuff after first load : 

for GET : GET http://localhost:3000/api/v1/analytics/overview?store_id=store_1&period=today 

First response was in 40ms, second in 4ms, we are faaaaaar below 500ms (because running locally)
still a 10x improvment thanks to redis, this also applies to overview since cached.


*/