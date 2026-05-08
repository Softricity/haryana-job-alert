// src/supabase/supabase.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseUrl: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('FATAL: Supabase URL or Key not found in .env');
      throw new InternalServerErrorException('Supabase URL or Key not provided in .env');
    }

    this.supabaseUrl = supabaseUrl;
    
    this.supabase = createClient(this.supabaseUrl, supabaseKey);
  }

  async uploadFile(file: Express.Multer.File, bucket: string, path: string): Promise<string> {
    const fileName = `${path}/${Date.now()}-${file.originalname}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to upload file to Supabase: ${error.message}`
      );
    }

    // MANUALLY BUILD PUBLIC URL
    const publicUrl = `${this.supabaseUrl}/object/public/${bucket}/${data.path}`;

    return publicUrl;
  }
}