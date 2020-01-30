# graphql-lightstep-middleware

[![NPM](https://nodei.co/npm/graphql-lightstep-middleware.png)](https://npmjs.org/package/graphql-lightstep-middleware)

GraphQL middleware to instrument and augment resolvers with opentracing traces for lightstep collector

![build](https://github.com/addityasingh/graphql-lightstep-middleware/workflows/build/badge.svg)
[![downloads](https://img.shields.io/npm/dt/graphql-lightstep-middleware.svg)](https://npmjs.org/package/graphql-lightstep-middleware?cacheSeconds=60)
[![version](https://img.shields.io/npm/v/graphql-lightstep-middleware.svg)](https://npmjs.org/package/graphql-lightstep-middleware?cacheSeconds=3600)

## Table of contents

- [Getting started](#getting-started)
- [API](#api)
- [Contributing](#contributing)
  - [Code of Conduct](#code-of-conduct)
  - [Contributing](#contributing)
  - [Good first issues](#good-first-issues)
- [License](#licence)

## Getting started

1. Install the package and graphql-middleware

```sh
yarn add graphql-lightstep-middleware
yarn add graphql-middleware
```

2. Create the lightstep global tracer

```javascript
import { initGlobalTracer } from "opentracing";
import { Tracer as LightstepTracer } from "lightstep-tracer";

// Initialise the lightstep tracer
initGlobalTracer(new LightstepTracer({
  access_token: "developer",
  component_name: "graphql-lightstep-middleware",
  collector_host: "localhost",
  collector_port: 8360,
  plaintext: true,
  collector_encryption: "none"
} as any));
```

3. Configure the middleware

```javascript
import graphqlLightstepMiddleware from "graphql-lightstep-middleware";

// create the lightstep-graphql-middleware
const lightstepMiddleware = graphqlLightstepMiddleware({
  tracer: globalTracer()
});
```

4. Apply the middleware to the schema

```javascript
import express from "express";
import graphqlExpressHttp from "express-graphql";
import { applyMiddleware } from "graphql-middleware";
import { makeExecutableSchema } from "graphql-tools";

// Construct a schema, using GraphQL schema language
const typeDefs = `
  type Query {
    hello(name: String): String
  }
`;

const resolvers = {
  Query: {
    hello: (parent, args, context) => {
      const result = `Hello ${args.name ? args.name : "world"}!`;
      // The rootSpan is available in the context now
      context.tracing.rootSpan.addTags({
        helloResolver: result
      });
      return result;
    }
  }
};

// apply the middleware to the schema
const schema = applyMiddleware(
  makeExecutableSchema({ typeDefs, resolvers }),
  lightstepMiddleware
);

// Use the schema in your graphql server
const app = express();
app.use(
  "/graphql",
  graphqlExpressHttp({
    schema: schema,
    rootValue: resolvers,
    graphiql: true
  })
);
```

## API

### middleware = graphqlLightstepMiddleware([options])

- `options`
  - `tracer`: An optional `lightstep` tracer object
  - `hooks`: Lost of `PreResolve` and `PostResolve` hooks

Refer the [examples](./examples) for more usage examples

## Contributing

`graphql-lightstep-middleware` package intends to support contribution and support and thanks the open source community to making it better. Read below to learn how you can improve this repository and package

### Code of Conduct

Please check the [CODE OF CONDUCT](./CODE_OF_CONDUCT) which we have in place to ensure safe and supportive environment for contributors

### Contributing

Feel free to create issues and bugs in the issues section using issues and bugs template. Please also ensure that there are not existing issues created on the same topic

### Good first issues

Please check issues labeled [#good-first-issues](https://github.com/addityasingh/graphql-lightstep-middleware/labels/good%20first%20issue) under the issues section

## Licence

`graphql-lightstep-middleware` uses [MIT License](./LICENSE)
