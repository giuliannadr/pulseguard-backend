import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GithubService } from './github.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('repos')
  async getRepos(@Req() req: any) {
    const token = req.headers['x-github-token'];
    if (!token) throw new UnauthorizedException('Missing GitHub token');
    const repos = await this.githubService.getUserRepos(token);
    return repos;
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('connect/:monitorId')
  async connectWebhook(
    @Param('monitorId') monitorId: string,
    @Body() body: { owner: string; repo: string },
    @Headers('x-github-token') githubToken: string,
    @Req() req: any,
  ) {
    if (!githubToken) {
      throw new UnauthorizedException('Missing x-github-token header');
    }
    return this.githubService.autoConfigureWebhook(
      monitorId,
      body.owner,
      body.repo,
      githubToken,
      req.user.id,
    );
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Body() payload: any,
  ) {
    if (event === 'push') {
      await this.githubService.handlePushEvent(payload);
    }
    return { received: true };
  }
}
