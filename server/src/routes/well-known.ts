import type { FastifyPluginAsync } from 'fastify';
import { config } from '../config.js';

export const wellKnownRoutes: FastifyPluginAsync = async (app) => {
  // OBP discovery document
  app.get('/.well-known/obp', async (_req, reply) => {
    return reply.send({
      version: '1.0',
      serverUrl: config.SERVER_URL,
      serverName: config.SERVER_NAME,
      capabilities: [
        'booking',
        'federation',
        'webhooks',
        'oauth2',
        'ical',
      ],
      endpoints: {
        providers: `${config.SERVER_URL}/obp/v1/providers`,
        services: `${config.SERVER_URL}/obp/v1/services`,
        slots: `${config.SERVER_URL}/obp/v1/slots`,
        bookings: `${config.SERVER_URL}/obp/v1/bookings`,
        federation: `${config.SERVER_URL}/federation`,
        oauth2: {
          authorization: `${config.SERVER_URL}/obp/v1/auth/authorize`,
          token: `${config.SERVER_URL}/obp/v1/auth/token`,
        },
      },
      federation: {
        peersEndpoint: `${config.SERVER_URL}/federation/peers`,
        publicKeyId: `${config.SERVER_URL}/federation/keys/main`,
      },
    });
  });

  // WebFinger discovery
  app.get('/.well-known/webfinger', async (req, reply) => {
    const { resource } = req.query as { resource?: string };

    if (!resource) {
      return reply.status(400).send({
        type: 'https://openbooking.example/errors/bad-request',
        title: 'Bad Request',
        status: 400,
        detail: 'resource parameter is required',
      });
    }

    return reply.send({
      subject: resource,
      links: [
        {
          rel: 'https://openbooking.example/rel/obp',
          href: `${config.SERVER_URL}/.well-known/obp`,
          type: 'application/json',
        },
      ],
    });
  });
};
