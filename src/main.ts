import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import * as nunjucks from 'nunjucks';
import { AppModule } from './app.module';
import { extractLogLevel } from './core/config/common-config';

async function bootstrap() {
  const logLevels = extractLogLevel(process.env.LOG_LEVEL);

  // let's create the nest app (with default express adapter)
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevels,
  });

  // get an instance of the config service, because we need it in bootstrapping
  const config: ConfigService = app.get(ConfigService);

  // Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately.
  // Generally, Helmet is just a collection of 12 smaller middleware functions that set security-related HTTP headers.
  // See: https://github.com/helmetjs/helmet#how-it-works
  const nonces = config.get<string[]>('crawl.scriptNonces').map((e) => {
    return `'nonce-${e}'`;
  });
  nonces.push("'self'", 'cdn.jsdelivr.net');

  // app.use(
  //   helmet.contentSecurityPolicy({
  //     useDefaults: true,
  //     directives: {
  //       scriptSrc: nonces,
  //       styleSrc: ["'self'", 'cdn.jsdelivr.net'],
  //       fontSrc: ["'self'", 'cdn.jsdelivr.net'],
  //       'script-src-attr': ["'self'", "'unsafe-inline'"], // can't remove that, the only way is to access the Button onclick Events via js. But all the Button ids are dynamic
  //     },
  //   }),
  // );

  // 'style-src-elem': ["'self'", nonces[0], 'cdn.jsdelivr.net'], -> <style nonce="{{ styleNonce }}"></style>
  // for scripts -> <script nonce="{{ nonce1 }}"></script>

  // Compression can greatly decrease the size of the response body and hence increase the speed of a web app.
  // Use the compression middleware to enable gzip compression.
  app.use(compression());

  // Cross-origin resource sharing (CORS) is a mechanism that allows resources to be requested from another domain.
  // In order to enable CORS, you have to call enableCors() method
  app.enableCors();

  // Configure nunjucks as view engine
  const express = app.getHttpAdapter().getInstance();
  const assets = `dist/assets`; // default directory with HTML, CSS etc.
  Logger.log(`Path to assets: ${assets}`, 'Main');
  nunjucks.configure(assets, { express });
  app.useStaticAssets(assets);
  app.setBaseViewsDir(assets);
  app.setViewEngine('njk');

  await app.listen(config.get('common.port'));
  return config.get('common.port');
}

bootstrap().then((port) => Logger.log(`👍 Service listening on port: ${port}`, 'Main'));
