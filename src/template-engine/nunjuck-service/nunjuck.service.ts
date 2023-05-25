import { Inject, Injectable, Logger } from '@nestjs/common';
import nunjucks from 'nunjucks';
import fs from 'fs-extra';

import { TemplateOptions } from '../template-engine.model';
import { NUNJUCKS_TOKEN } from '../nunjucks-environment.provider';

@Injectable()
export class NunjuckService {
  private readonly logger = new Logger(NunjuckService.name);

  constructor(@Inject(NUNJUCKS_TOKEN) private env: nunjucks.Environment) {}

  render<S = any>(options: TemplateOptions<S>, saveFile = true) {
    if (Array.isArray(options.data) && options.data.length < 1) {
      this.logger.verbose(`Nothing to do. List is empty...`);
      return;
    }

    const content = this.env.render(options.templateFilename, options);

    if (saveFile) {
      fs.outputFile(options.outputFilename, content)
        .then(() => this.logger.verbose('Successfully created ' + options.outputFilename))
        .catch((err) => console.error(err));
    }

    return content;
  }

  renderAndSaveFile<S = any>(options: TemplateOptions<S>) {
    return this.render(options, true);
  }
}
