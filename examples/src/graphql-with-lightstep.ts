import express from "express";
import { applyMiddleware } from "graphql-middleware";
import { makeExecutableSchema } from 'graphql-tools';
const graphqlExpressHttp = require("express-graphql");
import { initGlobalTracer, globalTracer } from "opentracing";
import { Tracer as LightstepTracer } from "lightstep-tracer";
import graphqlLightstepMiddleware from '../../dist/index.js';


// Initialise the lightstep tracer
initGlobalTracer(new LightstepTracer({
  access_token: "developer",
  component_name: "graphql-lightstep-middleware",
  collector_host: "localhost",
  collector_port: 8360,
  plaintext: true,
  collector_encryption: "none"
} as any));

// Construct a schema, using GraphQL schema language
const typeDefs = `
  type Query {
    hello(name: String): String
  }
`;

// The root provides a resolver function for each API endpoint
const resolvers = {
  Query: {
    hello: (parent, args, context) => {
      const result = `Hello ${args.name ? args.name : "world"}!`;
      // The rootSpan is available in the context now
      context.tracing.rootSpan.addTags({
        helloResolver: result
      });
      return result;
    },
  }
};

const lightstepMiddleware = graphqlLightstepMiddleware({
  tracer: globalTracer()
});

const schema = applyMiddleware(
  makeExecutableSchema({typeDefs, resolvers}),
  lightstepMiddleware,
)

const app = express();
app.use("/graphql", graphqlExpressHttp({
  schema: schema,
  rootValue: resolvers,
  graphiql: true,
}))

app.listen(4001, () => {
  console.log('Running a GraphQL API server at http://localhost:4000/graphql');
});