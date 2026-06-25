import { Controller, Get, Post, Body, Headers, UnauthorizedException, Param } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('repos')
  async listRepos(@Headers('x-github-token') githubToken: string) {
    if (!githubToken) {
      throw new UnauthorizedException('Missing x-github-token header');
    }
    return this.githubService.getUserRepos(githubToken);
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
    return this.githubService.autoConfigureWebhook(monitorId, body.owner, body.repo, githubToken);
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
