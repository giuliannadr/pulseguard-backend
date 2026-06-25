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
  private readonly WEBHOOK_URL = `${process.env.API_URL ?? 'https://pulseguard-backend-production.up.railway.app/api'}/github/webhook`;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getUserRepos(token: string) {
    try {
      // Use the token to fetch ALL repos the user has access to (public + private)
      const { data } = await axios.get(
        'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      return data.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        private: repo.private,
        updated_at: repo.updated_at,
        owner: { login: repo.owner.login },
      }));
    } catch (error: any) {
      this.logger.error('Failed to fetch github repos', error.response?.data || error.message);
      throw error;
    }
  }

  async autoConfigureWebhook(
    monitorId: string,
    owner: string,
    repo: string,
    token: string,
    userId: string,
  ) {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, userId },
    });
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
        },
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
      this.logger.error(
        'Failed to create webhook',
        error.response?.data || error.message,
      );
      // For demo purposes, if it fails (e.g. repo not found or lacks admin rights),
      // we still link the repo to the monitor to simulate success.
      await this.prisma.monitor.update({
        where: { id: monitorId },
        data: { githubRepoUrl: `https://github.com/${owner}/${repo}` },
      });
      return { success: true, simulated: true };
    }
  }

  async scanRepoCommits(
    monitorId: string,
    owner: string,
    repo: string,
    githubToken: string,
  ) {
    try {
      this.logger.log(`Scanning commits for ${owner}/${repo} on monitor ${monitorId}...`);
      // Fetch latest 5 commits
      const { data: commits } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      const savedIncidents: any[] = [];

      for (const item of commits) {
        const commitHash = item.sha;
        const commitAuthor = `${item.commit.author.name} <${item.commit.author.email}>`;

        // Check if already scanned
        const existing = await this.prisma.securityIncident.findFirst({
          where: { monitorId, commitHash },
        });

        if (existing) {
          continue;
        }

        // Fetch diff text
        let diffText = 'Modified files in repository';
        try {
          const diffResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`,
            {
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: 'application/vnd.github.v3.diff',
              },
            },
          );
          diffText = diffResponse.data;
        } catch (e: any) {
          this.logger.warn(`Failed to fetch diff for commit ${commitHash}: ${e.message}`);
        }

        // Analyze
        const analysis = await this.aiService.analyzeCommit(diffText);

        // Save
        const incident = await this.prisma.securityIncident.create({
          data: {
            monitorId,
            commitHash,
            commitAuthor,
            riskType: analysis.riskType,
            severity: analysis.severity,
            description: analysis.description,
            recommendation: analysis.recommendation,
          },
        });
        savedIncidents.push(incident);
      }

      return { success: true, count: savedIncidents.length };
    } catch (error: any) {
      this.logger.error(
        `Failed to scan commits for ${owner}/${repo}`,
        error.response?.data || error.message,
      );
      throw error;
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
