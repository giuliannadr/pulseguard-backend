import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Param,
  Req,
} from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('repos')
  async getRepos(@Req() req: any) {
    const token = req.headers['x-github-token'];
    console.log('--- GET REPOS CALLED ---');
    console.log('Headers:', req.headers);
    console.log('Token:', token ? token.substring(0, 10) + '...' : 'NONE');

    if (!token) throw new UnauthorizedException('Missing GitHub token');
    const repos = await this.githubService.getUserRepos(token);
    console.log('Repos returned:', repos.length);
    return repos;
  }

  @Post('connect/:monitorId')
  async connectWebhook(
    @Param('monitorId') monitorId: string,
    @Body() body: { owner: string; repo: string },
    @Headers('x-github-token') githubToken: string,
  ) {
    if (!githubToken) {
      throw new UnauthorizedException('Missing x-github-token header');
    }
    return this.githubService.autoConfigureWebhook(
      monitorId,
      body.owner,
      body.repo,
      githubToken,
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
