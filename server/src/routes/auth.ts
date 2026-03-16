import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
  authorize,
  exchangeCode,
  refreshToken,
  revokeToken,
} from '../modules/auth/service.js';
import { requireAuth, requireProviderAuth } from '../middleware/auth.js';
import { Errors } from '../lib/errors.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  // ── API Keys ────────────────────────────────────────────────────────────────

  app.get('/api-keys', { preHandler: requireProviderAuth() }, async (req, reply) => {
    return reply.send(await listApiKeys(req.auth!.providerId!));
  });

  app.post('/api-keys', { preHandler: requireProviderAuth() }, async (req, reply) => {
    const body = z.object({
      name: z.string().min(1).max(255),
      scopes: z.array(z.string()).default(['read']),
      expiresAt: z.string().datetime().optional(),
    }).safeParse(req.body);

    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());

    const result = await createApiKey({
      providerId: req.auth!.providerId!,
      name: body.data.name,
      scopes: body.data.scopes,
      expiresAt: body.data.expiresAt ? new Date(body.data.expiresAt) : undefined,
    });

    return reply.status(201).send(result);
  });

  app.delete<{ Params: { id: string } }>('/api-keys/:id', {
    preHandler: requireAuth(['admin', 'provider']),
  }, async (req, reply) => {
    await revokeApiKey(req.params.id);
    return reply.status(204).send();
  });

  app.post<{ Params: { id: string } }>('/api-keys/:id/rotate', {
    preHandler: requireAuth(['admin', 'provider']),
  }, async (req, reply) => {
    return reply.send(await rotateApiKey(req.params.id));
  });

  // ── OAuth2 ──────────────────────────────────────────────────────────────────

  app.get('/authorize', async (req, reply) => {
    const query = z.object({
      client_id: z.string(),
      redirect_uri: z.string().url(),
      response_type: z.literal('code'),
      scope: z.string().default('read'),
      code_challenge: z.string().optional(),
      code_challenge_method: z.enum(['S256']).optional(),
      state: z.string().optional(),
    }).safeParse(req.query);

    if (!query.success) throw Errors.validationError('Invalid query', query.error.flatten());

    const { code, redirectUri } = await authorize({
      clientId: query.data.client_id,
      redirectUri: query.data.redirect_uri,
      scopes: query.data.scope.split(' '),
      codeChallenge: query.data.code_challenge,
      codeChallengeMethod: query.data.code_challenge_method,
    });

    const url = new URL(redirectUri);
    url.searchParams.set('code', code);
    if (query.data.state) url.searchParams.set('state', query.data.state);

    return reply.redirect(url.toString());
  });

  app.post('/token', async (req, reply) => {
    const body = z.discriminatedUnion('grant_type', [
      z.object({
        grant_type: z.literal('authorization_code'),
        code: z.string(),
        client_id: z.string(),
        redirect_uri: z.string().url(),
        code_verifier: z.string().optional(),
      }),
      z.object({
        grant_type: z.literal('refresh_token'),
        refresh_token: z.string(),
        client_id: z.string(),
      }),
    ]).safeParse(req.body);

    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());

    let result;
    if (body.data.grant_type === 'authorization_code') {
      result = await exchangeCode({
        code: body.data.code,
        clientId: body.data.client_id,
        redirectUri: body.data.redirect_uri,
        codeVerifier: body.data.code_verifier,
      });
    } else {
      result = await refreshToken({
        refreshToken: body.data.refresh_token,
        clientId: body.data.client_id,
      });
    }

    return reply.send(result);
  });

  app.post('/revoke', async (req, reply) => {
    const body = z.object({ token: z.string() }).safeParse(req.body);
    if (!body.success) throw Errors.validationError('Invalid body', body.error.flatten());
    await revokeToken(body.data.token);
    return reply.status(200).send({});
  });
};
