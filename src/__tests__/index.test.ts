import { MockTracer } from "opentracing";
import graphqlLightstepMiddleware, { LifecycleHook } from "..";
import { MockSpan } from "opentracing/lib/mock_tracer";

describe("graphql-lightstep-middleware", () => {
  const mockRoot = {};
  const mockArgs = {};
  const mockInfo = {};
  const mockContext: any = {};
  const mockResolve = jest.fn();
  const mockOptions = {
    tracer: new MockTracer()
  };

  beforeEach(() => {
    mockResolve.mockClear();
  });

  test("should call the resolver with correct options", async () => {
    const mockResolve = jest.fn();
    const middleware: any = graphqlLightstepMiddleware(mockOptions);
    await middleware(mockResolve, mockRoot, mockArgs, mockContext, mockInfo);
    expect(mockResolve).toBeCalledWith(
      mockRoot,
      mockArgs,
      mockContext,
      mockInfo
    );
  });

  test("should add a tracer and root span for every resolver to context", async () => {
    const mockContext: any = {};
    const middleware: any = graphqlLightstepMiddleware(mockOptions);
    await middleware(mockResolve, mockRoot, mockArgs, mockContext, mockInfo);

    expect(mockContext.tracing).toBeDefined();
    expect(mockContext.tracing.tracer).toBeDefined();
    expect(mockContext.tracing.tracer).toBeInstanceOf(MockTracer);
    expect(mockContext.tracing.rootSpan).toBeDefined();
    expect(mockContext.tracing.rootSpan).toBeInstanceOf(MockSpan);
  });

  describe("hooks::follow onion principle", () => {
    test("should execute `PreResolve` hook for resolver", async () => {
      const mockPreHook = jest.fn();
      const mockHooks = {
        [LifecycleHook.PreResolve]: [mockPreHook]
      };

      const middleware: any = graphqlLightstepMiddleware(
        mockOptions,
        mockHooks
      );
      await middleware(mockResolve, mockRoot, mockArgs, mockContext, mockInfo);
      expect(mockPreHook).toBeCalled();
      expect(mockPreHook).toBeCalledWith(mockContext);
    });

    test("should execute `PostResolve` hook for resolver", async () => {
      const mockPostHook = jest.fn();
      const mockHooks = {
        [LifecycleHook.PostResolve]: [mockPostHook]
      };

      const middleware: any = graphqlLightstepMiddleware(
        mockOptions,
        mockHooks
      );
      await middleware(mockResolve, mockRoot, mockArgs, mockContext, mockInfo);
      expect(mockPostHook).toBeCalled();
      expect(mockPostHook).toBeCalledWith(mockContext);
    });

    test("should execute all configured hooks for resolver", async () => {
      const mockPostHook = jest.fn();
      const mockPreHook = jest.fn();
      const mockResolve = jest.fn(() => "mock value");
      const mockHooks = {
        [LifecycleHook.PreResolve]: [mockPreHook],
        [LifecycleHook.PostResolve]: [mockPostHook]
      };

      const middleware: any = graphqlLightstepMiddleware(
        mockOptions,
        mockHooks
      );
      await middleware(mockResolve, mockRoot, mockArgs, mockContext, mockInfo);
      expect(mockPreHook).toBeCalled();
      expect(mockPreHook).toBeCalledWith(mockContext);
      expect(mockContext.resolvedData).toBe("mock value");
      expect(mockPostHook).toBeCalled();
      expect(mockPostHook).toBeCalledWith(mockContext);
    });
  });
});
