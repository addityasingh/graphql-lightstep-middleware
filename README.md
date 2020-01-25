# graphql-lightstep-middleware

GraphQL middleware to instrument resolvers with opentracing traces for lightstep collector

## Usage

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

## Development
