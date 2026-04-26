import { Injectable } from '@nestjs/common';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  errors?: string[];
}

@Injectable()
export class ApiResponseMapper {
  success<T>(data: T, message: string = 'İşlem başarılı'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  error(message: string, errors?: string[]): ApiResponse {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): ApiResponse<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return {
      success: true,
      message: 'İşlem başarılı',
      data: {
        items: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
