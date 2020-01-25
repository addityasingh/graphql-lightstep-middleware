import { GraphQLResolveInfo } from "graphql";
import { IMiddlewareFunction } from "graphql-middleware";
import {
  Tracer,
  Span,
  FORMAT_HTTP_HEADERS,
  SpanOptions,
  SpanContext
} from "opentracing";

interface MiddlewareOptions {
  tracer: Tracer;
  rootSpanName?: string;
  isChildOf?: boolean;
}

interface ContextTracingOptions {
  tracer: Tracer;
  rootSpan: Span;
}

interface HookContext<T, D> {
  tracing: ContextTracingOptions;
  resolvedData?: D;
  args: any;
  context: T;
  info: GraphQLResolveInfo;
  err?: Error;
}

type MiddlewareHookFn<T, D> = (
  context: HookContext<T, D>
) => void | Promise<any>;

export enum LifecycleHook {
  PreResolve = "PreResolve",
  PostResolve = "PostResolve"
}

interface MiddlewareHooks<T, D> {
  [lifecycle: string]: Array<MiddlewareHookFn<T, D>>;
}

async function executeHooks<T, D>(
  lifecycle: LifecycleHook,
  lifecycleHooks: MiddlewareHooks<T, D>,
  context: HookContext<T, D>
) {
  const hooks = lifecycleHooks[lifecycle];
  if (!Array.isArray(hooks)) {
    return;
  }
  for (const hook of hooks) {
    if (typeof hook == "function") {
      await hook.apply(null, [context]);
    }
  }
}

/**
 * GraphQL lightstep middleware to add root span for each resolver request and execute
 * lifecycle hooks before and after resolving Fields
 * @param options The options for the middleware
 * @param hooks Hooks to execute before and after executing the middlewares
 */
const graphqlLightstepMiddleware = <T = any, D = any>(
  options: MiddlewareOptions,
  hooks: MiddlewareHooks<T, D> = {}
): IMiddlewareFunction => {
  const { tracer, rootSpanName, isChildOf } = options;

  return async (resolve, root, args, context, info) => {
    const parentSpan: SpanContext | null = isChildOf
      ? tracer.extract(FORMAT_HTTP_HEADERS, context.req.headers)
      : null;
    const spanOptions: SpanOptions = !!parentSpan
      ? { childOf: parentSpan }
      : {};
    const spanName = rootSpanName || "execute_query";
    const rootSpan = tracer.startSpan(spanName, spanOptions);
    context.tracing = { tracer, rootSpan };

    await executeHooks(LifecycleHook.PreResolve, hooks, context);
    const result = await resolve(root, args, context, info);
    context.resolvedData = result;
    await executeHooks(LifecycleHook.PostResolve, hooks, context);

    rootSpan.finish();
    return result;
  };
};

export default graphqlLightstepMiddleware;
