#!/usr/bin/env node

import 'isomorphic-fetch';
import program from 'commander';
import parseHydraDocumentation from 'api-doc-parser/lib/hydra/parseHydraDocumentation';
import {version} from '../package.json';
import generators from './generators';

program
  .version(version)
  .description('Generate a CRUD application built with React, Redux and React Router from an Hydra-enabled API')
  .usage('entrypoint outputDirectory')
  .option('-r, --resource [resourceName]', 'Generate CRUD for the given resource')
  .option('-p, --hydra-prefix [hydraPrefix]', 'The hydra prefix used by the API', 'hydra:')
  .option('-g, --generator [generator]', 'The generator to use, one of "react", "react-native", "angular", etc.', 'react')
  .option('-t, --template-directory [templateDirectory]', 'The templates directory base to use. Final directory will be ${templateDirectory}/${generator}', `${__dirname}/../templates/`)
  .parse(process.argv);

if (2 !== program.args.length && (!process.env.API_PLATFORM_CLIENT_GENERATOR_ENTRYPOINT || !process.env.API_PLATFORM_CLIENT_GENERATOR_OUTPUT)) {
  program.help();
}

const entrypoint = program.args[0] || process.env.API_PLATFORM_CLIENT_GENERATOR_ENTRYPOINT;
const outputDirectory = program.args[1] || process.env.API_PLATFORM_CLIENT_GENERATOR_OUTPUT;

const generator = generators(program.generator)({
  hydraPrefix: program.hydraPrefix,
  templateDirectory: program.templateDirectory
});
const resourceToGenerate = program.resource ? program.resource.toLowerCase() : null;

parseHydraDocumentation(entrypoint).then(api => {
  for (let resource of api.api.resources) {
    const nameLc = resource.name.toLowerCase();
    const titleLc = resource.title.toLowerCase();

    if (null === resourceToGenerate || nameLc === resourceToGenerate || titleLc === resourceToGenerate) {
      generator.generate(api, resource, outputDirectory);
      generator.help(resource)
    }
  }

  if ('entrypoint' in generator) {
    generator.entrypoint(entrypoint, outputDirectory);
  }

  if ('utils' in generator) {
    generator.utils(outputDirectory);
  }
}).catch((e) => {
  console.log(e);
});
