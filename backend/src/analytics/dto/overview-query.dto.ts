import { IsOptional, IsIn, IsISO8601, ValidateIf } from 'class-validator';



/* This is the only  */
export class OverviewQueryDto {
  @IsOptional()
  @IsIn(['today', 'week', 'month'], {
    message: 'period must be one of: today, week, month',
  })
  period?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'start must be a valid ISO 8601 date string' })
  start?: string;

  @ValidateIf((o) => !!o.start)
  @IsISO8601({}, { message: 'end must be a valid ISO 8601 date string' })
  end?: string;
}
