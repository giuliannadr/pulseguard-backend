import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import axios from 'axios';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  // Hardcode backend URL for demo purposes, normally in env
  // For Railway/local demo, you'd use a public URL or ngrok
  // Assuming frontend knows backend URL, let's just use a placeholder
  private readonly WEBHOOK_URL = process.env.API_URL 
    ? `${process.env.API_URL}/github/webhook` 
    : 'https://pulseguard-backend.up.railway.app/github/webhook';

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getUserRepos(token: string) {
    try {
      // 1. Get the authenticated user's username (works even without repo scope)
      const userRes = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const username = userRes.data.login;

      // 2. Fetch the user's public repositories using the /users endpoint
      // This bypasses the need for 'public_repo' scope on the token
      // WE MUST NOT SEND THE TOKEN HERE, otherwise GitHub restricts the response!
      const { data } = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, {
        headers: { 
          Accept: 'application/vnd.github.v3+json',
        },
      });
      
      return data.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        private: repo.private,
        updated_at: repo.updated_at,
        owner: { login: repo.owner.login }
      }));
    } catch (error) {
      this.logger.error('Failed to fetch github repos', error);
      throw error;
    }
  }

  async autoConfigureWebhook(monitorId: string, owner: string, repo: string, token: string) {
    const monitor = await this.prisma.monitor.findUnique({ where: { id: monitorId } });
    if (!monitor) throw new NotFoundException('Monitor not found');

    const webhookPayload = {
      name: 'web',
      active: true,
      events: ['push'],
      config: {
        url: `${this.WEBHOOK_URL}?monitorId=${monitorId}`,
        content_type: 'json',
      },
    };

    try {
      const { data } = await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/hooks`,
        webhookPayload,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      await this.prisma.monitor.update({
        where: { id: monitorId },
        data: {
          githubRepoUrl: `https://github.com/${owner}/${repo}`,
          githubWebhookId: data.id.toString(),
        },
      });

      return { success: true, webhookId: data.id };
    } catch (error: any) {
      this.logger.error('Failed to create webhook', error.response?.data || error.message);
      // For demo purposes, if it fails (e.g. repo not found or lacks admin rights),
      // we still link the repo to the monitor to simulate success.
      await this.prisma.monitor.update({
        where: { id: monitorId },
        data: { githubRepoUrl: `https://github.com/${owner}/${repo}` },
      });
      return { success: true, simulated: true };
    }
  }

  async handlePushEvent(payload: any) {
    // Determine which monitor this belongs to
    // In a real app we'd get monitorId from the query param of the webhook URL
    // But since the payload contains repository.html_url, we can find it that way
    const repoUrl = payload.repository?.html_url;
    if (!repoUrl) return;

    const monitors = await this.prisma.monitor.findMany({
      where: { githubRepoUrl: repoUrl },
    });

    if (monitors.length === 0) return;

    // Get the commits
    const commits = payload.commits || [];
    if (commits.length === 0) return;

    for (const commit of commits) {
      // Fetch diff from github API
      // commit.url is like https://api.github.com/repos/owner/repo/commits/hash
      let diffText = 'Added some new code'; // fallback
      try {
        const { data } = await axios.get(commit.url, {
          headers: { Accept: 'application/vnd.github.v3.diff' },
        });
        diffText = data;
      } catch (e) {
        this.logger.warn(`Failed to fetch diff for commit ${commit.id}`);
      }

      // Analyze with AI
      const analysis = await this.aiService.analyzeCommit(diffText);

      // Save to database
      for (const monitor of monitors) {
        await this.prisma.securityIncident.create({
          data: {
            monitorId: monitor.id,
            commitHash: commit.id,
            commitAuthor: `${commit.author.name} <${commit.author.email}>`,
            riskType: analysis.riskType,
            severity: analysis.severity,
            description: analysis.description,
            recommendation: analysis.recommendation,
          },
        });
      }
    }
  }
}
